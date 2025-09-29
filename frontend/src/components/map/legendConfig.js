export const legendConfig = {
  ndvi: {
    title: "NDVI",
    min: -1,
    max: 1,
    palette: ["#0066cc", "#ffffff", "#00cc66"] // Blue to white to green
  },
  ndbi: {
    title: "NDBI", 
    min: -1,
    max: 1,
    palette: ["#ffffff", "#ff8800", "#cc0000"] // White to orange to red
  },
  lst: {
    title: "LST (°C)",
    min: 7,
    max: 50,
    palette: [
      "#040274", "#040281", "#0502a3", "#0502b8", "#0502ce", "#0502e6",
      "#0602ff", "#235cb1", "#307ef3", "#269db1", "#30c8e2", "#32d3ef", 
      "#3be285", "#3ff38f", "#86e26f", "#3ae237", "#b5e22e", "#d6e21f",
      "#fff705", "#ffd611", "#ffb613", "#ff8b13", "#ff6e08", "#ff500d",
      "#ff0000", "#de0101", "#c21301", "#a71001", "#911003"
    ]
  },
  uhi: {
    title: "Urban Heat Island (°C)",
    min: -4,
    max: 4, 
    palette: [
      "#313695", "#74add1", "#fed976", "#feb24c",
      "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"
    ]
  },
  utfvi: {
    title: "UTFVI",
    min: -1,
    max: 0.3,
    palette: [
      "#313695", "#74add1", "#fed976", "#feb24c", 
      "#fd8d3c", "#fc4e2a", "#e31a1c", "#b10026"
    ]
  },
  lulc: {
    title: "Land Use Land Cover",
    type: "discrete",
    classes: [
      { color: "#419BDF", label: "Water" },
      { color: "#397D49", label: "Trees" },
      { color: "#88B053", label: "Grass" },
      { color: "#7A87C6", label: "Flooded vegetation" },
      { color: "#E49635", label: "Crops" },
      { color: "#DFC35A", label: "Shrub & scrub" },
      { color: "#C4281B", label: "Built-up" },
      { color: "#A59B8F", label: "Bare ground" },
      { color: "#B39FE1", label: "Snow & ice" }
    ]
  },
  heatVulnerabilityZones: {
    title: "Heat Vulnerability Zones",
    type: "discrete",
    classes: [
      { color: "#313695", label: "Very Low" },
      { color: "#74add1", label: "Low" },
      { color: "#fdae61", label: "Medium" },
      { color: "#f46d43", label: "High" },
      { color: "#a50026", label: "Very High" }
    ]
  }
}
