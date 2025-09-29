import { Router } from "express";
import { getLULC, generateHVZs, processMetrics } from "../services/compute.js";
const router = Router();

router.post('/data', async (req, res) => {
    try {
        const { startDate, endDate, geometry, metrics } = req.body;

        if (!metrics) return res.status(400).send("No metrics requested");

        console.log('Processing request received:', {
            geometry: geometry?.type,
            startDate: startDate,
            endDate: endDate,
            metrics: metrics
        });

        if (!geometry || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: geometry, startDate, or endDate'
            });
        }

        if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid geometry: missing or invalid coordinates'
            });
        } 
        
        const results = await processMetrics(startDate, endDate, geometry, metrics);
        console.log(results);
        res.json(results);
        
    } catch (error) {
        console.error(error);
    }
});

router.post('/additionals', async (req, res) => {
    try {
        const { geometry, startDate, endDate, year, options} = req.body;
        console.log('Additionals request received:', {
            geometry: geometry?.type,
            startDate: startDate,
            endDate: endDate,
            year: year,
            options: options
        });
        let results = {};
        if (options.includes('LULC')) {
            const lulc = await getLULC(geometry, startDate, endDate);
            results.LULC = lulc;
        }
        if (options.includes('heatVulnerabilityZones')) {
            const HVZs = await generateHVZs(geometry, startDate, endDate, year);
            results.heatVulneratbiltyZones = HVZs;
        }
        console.log(results);
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
})

export default router;

