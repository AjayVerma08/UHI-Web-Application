import { Router } from 'express';
import ReportGenerator from "../services/reportGenerator.js";
import path from 'path';
import fs from "fs";
const router = Router();
const reportGenerator = new ReportGenerator();

router.post('/generate-report', async (req, res) => {
    try {
        const { 
            analysisData, 
            additionalData, 
            metadata // { geometry, startDate, endDate, year }
        } = req.body;

        console.log('Report generation request received:', {
            hasAnalysisData: !!analysisData,
            hasAdditionalData: !!additionalData,
            metadata: metadata
        });

        // Validation
        if (!analysisData || !metadata) {
            return res.status(400).json({
                success: false,
                error: 'Missing required data: analysisData and metadata are required'
            });
        }

        if (!metadata.geometry || !metadata.startDate || !metadata.endDate) {
            return res.status(400).json({
                success: false,
                error: 'Metadata must include geometry, startDate, and endDate'
            });
        }

        // Start report generation (this is async and can take time)
        const result = await reportGenerator.generateComprehensiveReport(
            analysisData, 
            additionalData, 
            metadata
        );

        res.json({
            success: true,
            message: 'Report generated successfully',
            ...result
        });

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({
            success: false,
            error: `Report generation failed: ${error.message}`
        });
    }
});

// Route to download the generated report
router.get('/download-report/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const reportDir = path.join(process.cwd(), 'temp', 'reports', reportId);
        const zipPath = path.join(reportDir, 'comprehensive_report.zip');

        // Check if report exists
        if (!fs.existsSync(zipPath)) {
            return res.status(404).json({
                success: false,
                error: 'Report not found or has expired'
            });
        }

        // Get file stats for proper headers
        const stats = fs.statSync(zipPath);
        const filename = `UHI_Analysis_Report_${reportId.substring(0, 8)}.zip`;

        // Set proper headers for file download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', stats.size);

        // Stream the file
        const fileStream = fs.createReadStream(zipPath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to download report'
                });
            }
        });

        fileStream.on('end', () => {
            console.log(`Report downloaded: ${filename}`);
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download report'
        });
    }
});

// Route to check report generation status (for future use)
router.get('/report-status/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const reportDir = path.join(process.cwd(), 'temp', 'reports', reportId);
        const zipPath = path.join(reportDir, 'comprehensive_report.zip');

        const status = {
            reportId,
            status: fs.existsSync(zipPath) ? 'completed' : 'processing',
            ready: fs.existsSync(zipPath)
        };

        if (status.ready) {
            const stats = fs.statSync(zipPath);
            status.size = stats.size;
            status.downloadUrl = `/process/download-report/${reportId}`;
        }

        res.json({
            success: true,
            ...status
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check report status'
        });
    }
});

export default router;