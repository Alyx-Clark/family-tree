class Photo {
    constructor(id, photoUrl, description, createdAt, updatedAt, personId) {
        this.id = id;
        this.photoUrl = photoUrl;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.personId = personId;
    }

    // Create a new photo entry
    static async create(newPhotoData, dbConnection) {
        try {
            const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            newPhotoData.createdAt = newPhotoData.createdAt || currentDate;
            newPhotoData.updatedAt = newPhotoData.updatedAt || currentDate;
            const query = 'INSERT INTO Photo (PhotoUrl, Description, CreatedAt, UpdatedAt, PersonId) VALUES (?, ?, ?, ?, ?)';
            const results = await dbConnection.query(query, [newPhotoData.photoUrl, newPhotoData.description, newPhotoData.createdAt, newPhotoData.updatedAt, newPhotoData.personId]);
            return results;
        } catch (error) {
            // Handle or throw the error depending on your error handling strategy
            console.error('Error in Photo.create:', error);
            throw error;
        }
    }

    // Read (get) photo by ID
    static async getById(photoId, dbConnection) {
        try {
            const query = 'SELECT * FROM Photo WHERE Id = ?';
            const [rows] = await dbConnection.query(query, [photoId]);
            return rows;
        } catch (error) {
            console.error('Error in Photo.getById:', error);
            throw error;
        }
    }

    // Read (get) all photos associated with a parentId
    static async getByPersonId(personId, dbConnection) {
        try {
            const query = 'SELECT * FROM Photo WHERE PersonId = ?';
            const [rows] = await dbConnection.query(query, [personId]);
            return rows;
        } catch (error) {
            console.error('Error in Photo.getByPersonId:', error);
            throw error;
        }
    }

    // Update photo
    static async updateById(photoId, updateData, dbConnection) {
        try {
            const query = 'UPDATE Photo SET PhotoUrl = ?, Description = ?, UpdatedAt = ?, PersonId = ? WHERE Id = ?';
            const results = await dbConnection.query(query, [updateData.photoUrl, updateData.description, updateData.updatedAt, updateData.personId, photoId]);
            return results;
        } catch (error) {
            console.error('Error in Photo.updateById:', error);
            throw error;
        }
    }

    // Delete photo
    static async deleteById(photoId, dbConnection) {
        try {
            const query = 'DELETE FROM Photo WHERE Id = ?';
            const results = await dbConnection.query(query, [photoId]);
            return results;
        } catch (error) {
            console.error('Error in Photo.deleteById:', error);
            throw error;
        }
    }
}

export default Photo;
