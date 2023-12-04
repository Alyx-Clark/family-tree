class Person {
    constructor(id, name, birthday, deathdate, placeOfBirth, aboutMe, isActive, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.birthday = birthday;
        this.deathdate = deathdate;
        this.placeOfBirth = placeOfBirth;
        this.aboutMe = aboutMe;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static async create(newPersonData, dbConnection) {
        try {
            const query = 'INSERT INTO Person (Name, Birthday, Deathdate, PlaceOfBirth, AboutMe, IsActive, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const results = await dbConnection.query(query, [newPersonData.name, newPersonData.birthday, newPersonData.deathdate, newPersonData.placeOfBirth, newPersonData.aboutMe, newPersonData.isActive, newPersonData.createdAt, newPersonData.updatedAt]);
            return results;
        } catch (error) {
            // Handle or throw the database error
            console.error('Error in Person.create:', error);
            throw error;
        }
    }

    static async getById(personId, dbConnection) {
        try {
            const query = 'SELECT * FROM Person WHERE Id = ?';
            const [rows] = await dbConnection.query(query, [personId]);
            return rows;
        } catch (error) {
            console.error('Error in Person.getById:', error);
            throw error;
        }
    }

    static async updateById(personId, updateData, dbConnection) {
        try {
            const query = 'UPDATE Person SET Name = ?, Birthday = ?, Deathdate = ?, PlaceOfBirth = ?, AboutMe = ?, IsActive = ?, UpdatedAt = ? WHERE Id = ?';
            const results = await dbConnection.query(query, [updateData.name, updateData.birthday, updateData.deathdate, updateData.placeOfBirth, updateData.aboutMe, updateData.isActive, updateData.updatedAt, personId]);
            return results;
        } catch (error) {
            console.error('Error in Person.updateById:', error);
            throw error;
        }
    }

    static async deleteById(personId, dbConnection) {
        try {
            const query = 'DELETE FROM Person WHERE Id = ?';
            const results = await dbConnection.query(query, [personId]);
            return results;
        } catch (error) {
            console.error('Error in Person.deleteById:', error);
            throw error;
        }
    }
}

export default Person;
