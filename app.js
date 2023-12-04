const express = require('express');
const personRoutes = require('./routes/personRoutes');
const photoRoutes = require('./routes/photoRoutes');
const parentChildRoutes = require('./routes/parentChildRoutes');
const spouseRoutes = require('./routes/spouseRoutes');
// other route imports...

const app = express();
app.use(express.json());

// Use routes
app.use('/api/persons', personRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/parentChild', parentChildRoutes);
app.use('/api/spouses', spouseRoutes);
// other app.use() calls for different routes...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Additional configurations...
