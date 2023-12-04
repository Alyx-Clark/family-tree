class Spouse {
    constructor(husbandId, wifeId, marriageDate, divorceDate, status) {
        this.husbandId = husbandId;
        this.wifeId = wifeId;
        this.marriageDate = marriageDate;
        this.divorceDate = divorceDate;
        this.status = status;
    }

    // Create a new spouse record
    static async create(newSpouseData, dbConnection) {
        try {
            const query = 'INSERT INTO Spouse (HusbandId, WifeId, MarriageDate, DivorceDate, Status) VALUES (?, ?, ?, ?, ?)';
            const results = await dbConnection.query(query, [newSpouseData.husbandId, newSpouseData.wifeId, newSpouseData.marriageDate, newSpouseData.divorceDate, newSpouseData.status]);
            return results;
        } catch (error) {
            // Handle and throw the error appropriately
            console.error('Error in Spouse.create:', error.message);
            throw error;
        }
    }

    // Get spouse record by IDs
    static async getById(husbandId, wifeId, dbConnection) {
        try {
            const query = 'SELECT * FROM Spouse WHERE HusbandId = ? AND WifeId = ?';
            const [rows] = await dbConnection.query(query, [husbandId, wifeId]);
            return rows;
        } catch (error) {
            console.error('Error in Spouse.getById:', error.message);
            throw error;
        }
    }

    // Update spouse record
    static async updateById(husbandId, wifeId, updateData, dbConnection) {
        try {
            const query = 'UPDATE Spouse SET MarriageDate = ?, DivorceDate = ?, Status = ? WHERE HusbandId = ? AND WifeId = ?';
            const results = await dbConnection.query(query, [updateData.marriageDate, updateData.divorceDate, updateData.status, husbandId, wifeId]);
            return results;
        } catch (error) {
            console.error('Error in Spouse.updateById:', error.message);
            throw error;
        }
    }

    // Delete spouse record
    static async deleteById(husbandId, wifeId, dbConnection) {
        try {
            const query = 'DELETE FROM Spouse WHERE HusbandId = ? AND WifeId = ?';
            const results = await dbConnection.query(query, [husbandId, wifeId]);
            return results;
        } catch (error) {
            console.error('Error in Spouse.deleteById:', error.message);
            throw error;
        }
    }
}

export default Spouse;
