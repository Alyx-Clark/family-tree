import Spouse from '../models/Spouse.js';
import dbConnection from '../db.js';

const spouseController = {
    // Create a new spouse record
    async addSpouse(req, res) {
        try {
            const newSpouseData = req.body; // assuming your request body has the new spouse data
            const result = await Spouse.create(newSpouseData, dbConnection);
            res.status(201).json({ message: 'Spouse record added successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error adding spouse record', error: error.message });
        }
    },

    // Get spouse record by IDs
    async getSpouseById(req, res) {
        try {
            const { husbandId, wifeId } = req.params;
            const spouseRecord = await Spouse.getById(husbandId, wifeId, dbConnection);
            if (spouseRecord.length > 0) {
                res.status(200).json(spouseRecord[0]);
            } else {
                res.status(404).json({ message: 'Spouse record not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching spouse record', error: error.message });
        }
    },

    // Update spouse record
    async updateSpouse(req, res) {
        try {
            const { husbandId, wifeId } = req.params;
            const updateData = req.body;
            const result = await Spouse.updateById(husbandId, wifeId, updateData, dbConnection);
            res.status(200).json({ message: 'Spouse record updated successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error updating spouse record', error: error.message });
        }
    },

    // Delete spouse record
    async deleteSpouse(req, res) {
        try {
            const { husbandId, wifeId } = req.params;
            const result = await Spouse.deleteById(husbandId, wifeId, dbConnection);
            res.status(200).json({ message: 'Spouse record deleted successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting spouse record', error: error.message });
        }
    }
};

export default spouseController;
