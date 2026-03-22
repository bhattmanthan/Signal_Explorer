const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const SIM_EXEC = path.join(__dirname, '..', 'sim.exe');

app.get('/simulate', (req, res) => {
    const { distance, temperature, bandwidth, levels, inputPower, medium } = req.query;
    
    if (!distance) return res.status(400).json({error: "Missing parameters"});

    const cmd = `"${SIM_EXEC}" ${distance} ${temperature} ${bandwidth} ${levels} ${inputPower} ${medium}`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("Execution error:", error);
            return res.status(500).json({ error: "Failed to run C simulator", details: stderr });
        }
        
        try {
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (e) {
            console.error("Parse error on output:", stdout);
            res.status(500).json({ error: "Failed to parse simulation output" });
        }
    });
});

app.listen(3000, () => {
    console.log("Backend server running on http://localhost:3000");
});
