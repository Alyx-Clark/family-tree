import express from 'express';
import personRoutes from './routes/personRoutes';
import photoRoutes from './routes/photoRoutes';
import parentChildRoutes from './routes/parentChildRoutes';
import spouseRoutes from './routes/spouseRoutes';

const app = express();
app.use(express.json());

// Use routes
app.use('/api/persons', personRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/parentChild', parentChildRoutes);
app.use('/api/spouses', spouseRoutes);
// other app.use() calls for different routes...

app.get('/test', (req, res) => {
    res.status(200).send('Server is working!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));