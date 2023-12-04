import ParentChild from '../models/ParentChild.js';
import dbConnection from '../db.js';

const parentChildController = {
    // Add a new parent-child relationship
    async addParentChildRelation(req, res) {
        try {
            const relationData = req.body; // assuming your request body has the parent-child relationship data
            const result = await ParentChild.create(relationData, dbConnection);
            res.status(201).json({ message: 'Parent-Child relationship added successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error adding parent-child relationship', error: error.message });
        }
    },

    // Get children of a person
    async getChildrenByParentId(req, res) {
        try {
            const parentId = req.params.parentId;
            const children = await ParentChild.getChildrenByParentId(parentId, dbConnection);
            if (children.length > 0) {
                res.status(200).json(children);
            } else {
                res.status(404).json({ message: 'No children found for this parent' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching children', error: error.message });
        }
    },

    // Get parents of a person
    async getParentsByChildId(req, res) {
        try {
            const childId = req.params.childId;
            const parents = await ParentChild.getParentsByChildId(childId, dbConnection);
            if (parents.length > 0) {
                res.status(200).json(parents);
            } else {
                res.status(404).json({ message: 'No parents found for this child' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching parents', error: error.message });
        }
    },

    // Delete a parent-child relationship
    async deleteParentChildRelation(req, res) {
        try {
            const { parentId, childId } = req.params; // assuming you pass both parentId and childId as URL parameters
            const result = await ParentChild.deleteByIds(parentId, childId, dbConnection);
            res.status(200).json({ message: 'Parent-Child relationship deleted successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting parent-child relationship', error: error.message });
        }
    }
};

export default parentChildController;
