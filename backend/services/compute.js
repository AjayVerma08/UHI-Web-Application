import ee from "@google/earthengine";
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}

function maskL8sr(col) {
    // Bits 3 and 5 are cloud shadow and cloud, respectively.
    var cloudShadowBitMask = (1 << 3);
    var cloudsBitMask = (1 << 5);
    // Get the pixel QA band.
    var qa = col.select('QA_PIXEL');
    // Both flags should be set to zero, indicating clear conditions.
    var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
    return col.updateMask(mask);
}

function getLandsatCollection(startDate, endDate, geometry) {
    const landsatCollection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
        .filterDate(startDate, endDate)
        .filterBounds(geometry)
        .map(applyScaleFactors)
        .map(maskL8sr);
      
    return landsatCollection;
}

function calculateNDVI(image) {
    console.log("Computing NDVI...");
    
    const ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
    console.log("NDVI computed.");
    
    return ndvi;
}

function calculateNDBI(image) {
    console.log("Computing NDBI...");
    const ndbi = image.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');
    console.log("NDBI computed.");
    
    return ndbi;
}

function calculateLST(image, ndvi, geometry) {
    console.log("Computing LST...");
    const ndviStats = ndvi.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: geometry,
        scale: 30,
        maxPixels: 1e13
    });

    const ndviMax = ee.Number(ndviStats.get('NDVI_max'));
    const ndviMin = ee.Number(ndviStats.get('NDVI_min'));

    const fv = (ndvi.subtract(ndviMin).divide(ndviMax.subtract(ndviMin))).pow(ee.Number(2)).rename('FV')
    const em = fv.multiply(ee.Number(0.004)).add(ee.Number(0.986)).rename('EM')

    const thermal = image.select('ST_B10').rename('Thermal');
    const lst = thermal.expression(
        '(tb / (1 + ((11.5 * (tb / 14380)) * log(em)))) - 273.15',
        {
            'tb': thermal.select('Thermal'), // Brightness temperature in Kelvin
            'em': em                        // Emissivity
        }
    ).rename('LST');
    console.log("LST computed.");
    
    return lst;
}

function calculateUHI(lst, geometry) {
    console.log("Computing UHI...");
    var reducers = ee.Reducer.mean().combine({ 
        reducer2: ee.Reducer.stdDev(), 
        sharedInputs: true
    });

    const lstStats = lst.reduceRegion({
        reducer: reducers,
        geometry: geometry,
        scale: 30,
        maxPixels: 1e13
    });

    const lstMean = lstStats.get('LST_mean');
    const lstStd = lstStats.get('LST_stdDev');
    // console.log("Mean LST:", lstMean, "LST StdDev:", lstStd);
    const uhi = lst
        .subtract(ee.Image.constant(lstMean))
        .divide(ee.Image.constant(lstStd))
        .rename('UHI');
    console.log("UHI computed.");
    return uhi;
}

function calculateUTFVI(lst, geometry) {
    console.log("Computing UTFVI...");
    const lst_Get_mean = lst.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: geometry,
        scale: 30,
        maxPixels: 1e13
    });

    const lst_mean = lst_Get_mean.get('LST');
    const utfvi = lst.subtract(ee.Image.constant(lst_mean)).divide(lst).rename('UTFVI');
    console.log("UTFVI computed.");
    
    return utfvi;
}

function computeStatistics(image, geometry, bandName) {
  return new Promise((resolve, reject) => {
    const reducers = ee.Reducer.mean()
      .combine({ reducer2: ee.Reducer.minMax(), sharedInputs: true })
      .combine({ reducer2: ee.Reducer.stdDev(), sharedInputs: true });

    image.reduceRegion({
      reducer: reducers,
      geometry,
      scale: 30,
      maxPixels: 1e13
    }).evaluate((result, err) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// Compute histogram for visualization
function computeHistogram(image, geometry, bandName) {
  return new Promise((resolve, reject) => {
    image.select(bandName).reduceRegion({
      reducer: ee.Reducer.histogram({ maxBuckets: 50 }),
      geometry,
      scale: 30,
      maxPixels: 1e13
    }).evaluate((result, err) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function buildLayerObject(metric, image, visParams, geometry) {
  // Band name
  const bandName = await new Promise((resolve, reject) => {
    image.bandNames().evaluate((bn, err) => {
      if (err) return reject(err);
      resolve(bn[0]);
    });
  });
  console.log(bandName);

  // Tile URL
  const tileUrl = await new Promise((resolve, reject) => {
    image.getMapId(visParams, (map, err) => {
      if (err) return reject(err);
      resolve(`https://earthengine.googleapis.com/v1alpha/${map.mapid}/tiles/{z}/{x}/{y}`);
    });
  });
  console.log("tileURL generated");

  // Download URL
  const downloadParams = {
    scale: 30,
    region: geometry,
    format: 'GeoTIFF',
    crs: 'EPSG:4326',
    filePerBand: false,
    maxPixels: 1e13
  }
  const downloadUrl = await new Promise((resolve, reject) => {  
    image.getDownloadURL(downloadParams, (url, err) => {
      if (err) return reject(err);
      resolve(url);
    }); 
    });
  console.log("downloadURL generated");
  
  console.log("Computing stats and histogram...");
  
  // Stats + Histogram
  const stats = await computeStatistics(image, geometry, bandName);
  const histogram = await computeHistogram(image, geometry, bandName);

  // Convert stats keys into clean format
  const cleanStats = {
    mean: stats?.[`${bandName}_mean`] ?? null,
    min: stats?.[`${bandName}_min`] ?? null,
    max: stats?.[`${bandName}_max`] ?? null,
    stdDev: stats?.[`${bandName}_stdDev`] ?? null,
  };
  console.log("stats computed");
  return {
    id: metric,
    name: metric.toUpperCase(),
    tileUrl,
    downloadUrl,
    histogram: histogram?.[bandName] || null,
    statistics: cleanStats
  };
}

export async function populationDensity(year, region) {
  const availableYears = [2000, 2005, 2010, 2015, 2020];
  if (availableYears.includes(year)) {
    const popImage = ee.Image(`CIESIN/GPWv411/GPW_Population_Density/gpw_v4_population_density_rev11_${year}_30_sec`).select('population_density');
    return popImage.clip(region);
  }
  else if (year > 2020) {
    const popImage = ee.Image(`CIESIN/GPWv411/GPW_Population_Density/gpw_v4_population_density_rev11_2020_30_sec`).select('population_density');
    return popImage.clip(region);
  }
  else if (year < 2000) {
    const popImage = ee.Image(`CIESIN/GPWv411/GPW_Population_Density/gpw_v4_population_density_rev11_2000_30_sec`).select('population_density');
    return popImage.clip(region);
  }
  else {
    let lowerYear = Math.max(...availableYears.filter(y => y < year));
    let upperYear = Math.min(...availableYears.filter(y => y > year));
    const lowerImage = ee.Image(`CIESIN/GPWv411/GPW_Population_Density/gpw_v4_population_density_rev11_${lowerYear}_30_sec`).select('population_density');
    const upperImage = ee.Image(`CIESIN/GPWv411/GPW_Population_Density/gpw_v4_population_density_rev11_${upperYear}_30_sec`).select('population_density');

    const factor = (year - lowerYear) / (upperYear - lowerYear);
    const interpolated = lowerImage.add(upperImage.subtract(lowerImage).multiply(factor));

    return interpolated.clip(region);
  }
  
}

async function getElevationData(region) {
  const elevation = ee.Image('USGS/SRTMGL1_003').select('elevation').clip(region);
  return elevation;
}

export async function getLULC(region, startDate, endDate) {
  const data = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
    .filterDate(startDate, endDate)
    .filterBounds(region)
    .median()
    .clip(region);

  const LULC = data.select('label');

  const palette = [
    '419BDF', // Water (0)
    '397D49', // Trees (1)
    '88B053', // Grass (2)
    '7A87C6', // Flooded vegetation (3)
    'E49635', // Crops (4)
    'DFC35A', // Shrub & scrub (5)
    'C4281B', // Built-up (6) - Important for UHI!
    'A59B8F', // Bare ground (7)
    'B39FE1'  // Snow & ice (8)
  ]

  const lulcVis = {
    min: 0,
    max: 8,
    palette: palette
  }

  const tileURL = await new Promise((resolve, reject) => {
    LULC.getMapId(lulcVis, (map, err) => {
      if (err) return reject(err);
      resolve(`https://earthengine.googleapis.com/v1alpha/${map.mapid}/tiles/{z}/{x}/{y}`);
    });
  });
  const downloadParams = {
    scale: 10,
    region: region,
    format: 'GeoTIFF',
    crs: 'EPSG:4326',
    maxPixels: 1e13
  }

  const downloadURL = await new Promise((resolve, reject) => {  
    LULC.getDownloadURL(downloadParams, (url, err) => {
      if (err) return reject(err);
      resolve(url);
    }); 
  });

  return { tileURL: tileURL, downloadURL: downloadURL  };
}

// Fix the normalize function to return an Earth Engine image
function normalize(img, region) {
  return new Promise((resolve, reject) => {
    // Get band names asynchronously first
    img.bandNames().evaluate((bandNames, err) => {
      if (err) return reject(err);
      
      const bandName = bandNames[0];
      
      // Use a coarser scale and smaller region for statistics to reduce data volume
      const stats = img.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: region,
        scale: 200, // Increased from 100 to 200 meters to reduce data volume
        maxPixels: 1e9, // Reduced from 1e13 to 1e9
        bestEffort: true,
        tileScale: 4 // Add tile scale to reduce memory usage
      });

      stats.evaluate((result, err) => {
        if (err) return reject(err);
        
        if (!result) {
          return reject(new Error('No data available in the region'));
        }
        
        const min = result[`${bandName}_min`];
        const max = result[`${bandName}_max`];
        
        if (min === null || max === null) {
          return reject(new Error('Could not compute min/max values'));
        }
        
        console.log(`Normalizing ${bandName}: min=${min}, max=${max}`);
        
        // Return normalized image
        const normalized = img.subtract(min).divide(max - min);
        resolve(normalized);
      });
    });
  });
}

export async function generateHVZs(geometry, startDate, endDate, year) {
  try {
    // Validate inputs
    if (!geometry || !geometry.coordinates) {
      throw new Error("Invalid geometry provided");
    }
    
    let collection = getLandsatCollection(startDate, endDate, geometry); 
    
    // Check if collection has data
    const collectionSize = await new Promise((resolve, reject) => {
      collection.size().evaluate((size, err) => {
        if (err) reject(err);
        else resolve(size);
      });
    });
    
    if (collectionSize === 0) {
      throw new Error("No Landsat data available for the specified date range and region");
    }
    
    let composite = collection.median().clip(geometry);

    // Calculate base metrics
    const ndvi = calculateNDVI(composite);
    const lst = calculateLST(composite, ndvi, geometry);
    const uhi = calculateUHI(lst, geometry);
    const utfvi = calculateUTFVI(lst, geometry);
    const ndbi = calculateNDBI(composite);
    const popDensity = await populationDensity(year, geometry);
    
    // Get elevation data
    const elevation = await getElevationData(geometry);

    // Normalize all inputs with proper error handling
    const [ndviNorm, ndbiNorm, uhiNorm, utfviNorm, popDensityNorm, elevationNorm] = await Promise.all([
      normalize(ndvi, geometry).then(img => img.rename('NDVI_Norm')),
      normalize(ndbi, geometry).then(img => img.rename('NDBI_Norm')),
      normalize(uhi, geometry).then(img => img.rename('UHI_Norm')),
      normalize(utfvi, geometry).then(img => img.rename('UTFVI_Norm')),
      normalize(popDensity, geometry).then(img => img.rename('PopDen_Norm')),
      normalize(elevation, geometry).then(img => img.rename('Elev_Norm'))
    ]);

    console.log("All inputs normalized and renamed");

    // Calculate Heat Vulnerability Index with weights
    const hvz = uhiNorm.multiply(0.25)
      .add(utfviNorm.multiply(0.2))
      .add(ndviNorm.multiply(-0.15)) // Negative weight for vegetation (more vegetation = less vulnerability)
      .add(ndbiNorm.multiply(0.15))
      .add(popDensityNorm.multiply(0.15))
      .add(elevationNorm.multiply(-0.1)) // Negative weight for elevation (higher elevation = cooler)
      .rename('HVZ_Index');


    // Verify data availability with better error handling
    const hvzStats = await new Promise((resolve, reject) => {
      hvz.reduceRegion({
        reducer: ee.Reducer.count(),
        geometry: geometry,
        scale: 1000,
        maxPixels: 1e9,
        bestEffort: true
      }).evaluate((result, err) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const hvzCount = hvzStats?.HVZ_Index || 0;

    if (hvzCount === 0) {
      throw new Error("No data available in HVZ layer for the given geometry");
    }

    const hvzMinMax = await new Promise((resolve, reject) => {
      hvz.reduceRegion({
          reducer: ee.Reducer.minMax(),
          geometry: geometry,
          scale: 30,
          maxPixels: 1e9,
          bestEffort: true
        }).evaluate((result, err) => {
          if (err) reject(err);
          else resolve(result);
        });
    });

    const hvzMin = hvzMinMax?.HVZ_Index_min;
    const hvzMax = hvzMinMax?.HVZ_Index_max;

    const interval = (hvzMax - hvzMin) / 5;
    const classBreaks = [
      hvzMin,
      hvzMin + interval,
      hvzMin + 2 * interval,
      hvzMin + 3 * interval,
      hvzMin + 4 * interval,
      hvzMax
    ];

    const hvzVis = {
      min: hvzMin,
      max: hvzMax,
      palette: [
        '#313695', // very low
        '#74add1', // low
        '#fdae61', // medium
        '#f46d43', // high
        '#a50026'  // very high
      ]
    };

    const tileUrl = await new Promise((resolve, reject) => {
      hvz.getMapId(hvzVis, (map, err) => {
        if (err) return reject(err);
        resolve(`https://earthengine.googleapis.com/v1alpha/${map.mapid}/tiles/{z}/{x}/{y}`);
      });
    });

    const downloadParams = {
      scale: 30,
      region: geometry,
      format: 'GeoTIFF',
      crs: 'EPSG:4326',
      filePerBand: false,
      maxPixels: 1e13
    }

    const downloadUrl = await new Promise((resolve, reject) => {  
      hvz.getDownloadURL(downloadParams, (url, err) => {
        if (err) return reject(err);
        resolve(url);
      }); 
    });

    return { tileUrl: tileUrl, downloadUrl: downloadUrl }

  } catch (error) {
    console.error("Error in generateHVZs:", error.message);
    throw new Error(`HVZ generation failed: ${error.message}`);
  }
}

export async function processMetrics(startDate, endDate, geometry, metrics) {
  const visParams = {
    ndvi: { min: -1, max: 1, palette: ["blue", "white", "green"] },
    ndbi: { min: -1, max: 1, palette: ["white", "orange", "red"] },
    lst: { min: 7, max: 50, palette: ['040274','040281','0502a3','0502b8','0502ce','0502e6',
                                      '0602ff','235cb1','307ef3','269db1','30c8e2','32d3ef',
                                      '3be285','3ff38f','86e26f','3ae237','b5e22e','d6e21f',
                                      'fff705','ffd611','ffb613','ff8b13','ff6e08','ff500d',
                                      'ff0000','de0101','c21301','a71001','911003'] },
    uhi: { min: -4, max: 4, palette:['313695','74add1','fed976','feb24c','fd8d3c','fc4e2a','e31a1c','b10026'] },
    utfvi: { min: -1, max: 0.3, palette:['313695','74add1','fed976','feb24c','fd8d3c','fc4e2a','e31a1c','b10026'] }
  };

  let collection = getLandsatCollection(startDate, endDate, geometry); 
  let composite = collection.median().clip(geometry);

  const results = {};

  const ndvi = metrics.some(m => ['lst','uhi','utfvi'].includes(m.toLowerCase()))
    ? calculateNDVI(composite) : null;
  const lst = metrics.some(m => ['uhi','utfvi'].includes(m.toLowerCase()))
    ? calculateLST(composite, ndvi, geometry) : null;

  for (let metric of metrics) {
    switch (metric.toLowerCase()) {
      case "ndvi":
        results.ndvi = ndvi || calculateNDVI(composite);
        break;
      case "ndbi":
        results.ndbi = calculateNDBI(composite);
        break;
      case "lst":
        results.lst = lst || calculateLST(composite, ndvi, geometry);
        break;
      case "uhi":
        results.uhi = calculateUHI(lst, geometry);
        break;
      case "utfvi":
        results.utfvi = calculateUTFVI(lst, geometry);
        break;
      default:
        console.warn(`Unknown metric: ${metric}`);
    }
  }

  // Build final structured response
  const layers = [];
  for (let [metric, image] of Object.entries(results)) {
    const layerObj = await buildLayerObject(metric, image, visParams[metric], geometry);
    layers.push(layerObj);
  }
  console.log(layers);
  return { layers };
}


// export async function processMetrics(startDate, endDate, geometry, metrics) {

//     const visParams = {
//             ndvi: { min: -1, max: 1, palette: ["blue", "white", "green"] },
//             ndbi: { min: -1, max: 1, palette: ["white", "orange", "red"] },
//             lst: { min: 7, max: 50, palette: [
//                 '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
//                 '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
//                 '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
//                 'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
//                 'ff0000', 'de0101', 'c21301', 'a71001', '911003'
//             ] },
//             uhi: { min: -4, max: 4, palette:['313695', '74add1', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a', 'e31a1c', 'b10026'] },
//             utfvi:  { min: -1, max: 0.3, palette:['313695', '74add1', 'fed976', 'feb24c', 'fd8d3c', 'fc4e2a', 'e31a1c', 'b10026'] }
//         };

//     let collection = getLandsatCollection(startDate, endDate, geometry); 
//     // let count = await collection.size().getInfo();
//     // console.log(count);
//     // let first = collection.first();
//     // console.log("First image bands:", await first.bandNames().getInfo());

//     let composite = collection.median().clip(geometry);


//     const results = {}
    
//     const ndvi = metrics.some(m => ['lst', 'uhi', 'utfvi'].includes(m.toLowerCase())) 
//                ? calculateNDVI(composite) 
//                : null;

//     const lst = metrics.some(m => ['uhi', 'utfvi'].includes(m.toLowerCase())) 
//                 ? calculateLST(composite, ndvi, geometry) 
//                 : null;

//     for (let metric of metrics) {
//     switch (metric.toLowerCase()) {
//         case "ndvi":
//         results.ndvi = ndvi || calculateNDVI(composite);
//         break;

//         case "ndbi":
//         results.ndbi = calculateNDBI(composite);
//         break;

//         case "lst":
//         results.lst = lst || calculateLST(composite, ndvi, geometry);
//         break;

//         case "uhi":
//         results.uhi = calculateUHI(lst, geometry);
//         break;

//         case "utfvi":
//         results.utfvi = calculateUTFVI(lst, geometry);
//         break;

//         default:
//         console.warn(`Unknown metric: ${metric}`);
//       }
//     }

//     const urls = {}
//     for (let [metric, image] of Object.entries(results)) {
//     urls[metric] = await new Promise((resolve, reject) => {
//         image.getMapId(visParams[metric], (map, err) => {
//         if (err) return reject(err);
//         resolve(`https://earthengine.googleapis.com/v1alpha/${map.mapid}/tiles/{z}/{x}/{y}`);
//         });
//     });
//     }
//     console.log(urls);


//     return urls;

// }
