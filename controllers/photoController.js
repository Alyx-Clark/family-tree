import Photo from '../models/Photo.js';
import dbConnection from '../db.js';

const photoController = {
    // Add a new photo
    async addPhoto(req, res) {
        try {
            const newPhotoData = req.body; // assuming your request body has the new photo data
            const result = await Photo.create(newPhotoData, dbConnection);
            res.status(201).json({ message: 'Photo added successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error adding photo', error: error.message });
        }
    },

    // Get photo ID
    async getPhotoById(req, res) {
        try {
            const photoId = req.params.id;
            const photo = await Photo.getById(photoId, dbConnection);
            if (photo.length > 0) {
                res.status(200).json(photo[0]);
            } else {
                res.status(404).json({ message: 'Photo not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching photo', error: error.message });
        }
    },

    // Get photos by Person ID
    async getPhotosByPersonId(req, res) {
        try {
            const personId = req.params.personId;
            const photos = await Photo.getByPersonId(personId, dbConnection);
            if (photos.length > 0) {
                res.status(200).json(photos);
            } else {
                res.status(404).json({ message: 'No photos found for this person' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching photos', error: error.message });
        }
    },

    // Update photo details
    async updatePhoto(req, res) {
        try {
            const photoId = req.params.id;
            const updateData = req.body;
            const result = await Photo.updateById(photoId, updateData, dbConnection);
            res.status(200).json({ message: 'Photo updated successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error updating photo', error: error.message });
        }
    },

    // Delete a photo
    async deletePhoto(req, res) {
        try {
            const photoId = req.params.id;
            const result = await Photo.deleteById(photoId, dbConnection);
            res.status(200).json({ message: 'Photo deleted successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting photo', error: error.message });
        }
    }
};

export default photoController;
