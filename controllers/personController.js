import Person from '../models/Person.js';
import dbConnection from '../db.js';

const personController = {
    // Create a new person
    async createPerson(req, res) {
        try {
            const newPersonData = req.body;
            const result = await Person.create(newPersonData, dbConnection);
            res.status(201).json({ message: 'Person created successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error creating person', error: error.message });
        }
    },

    // Get a person by ID
    async getPersonById(req, res) {
        try {
            const personId = req.params.id;
            const person = await Person.getById(personId, dbConnection);
            if (person.length > 0) {
                res.status(200).json(person[0]);
            } else {
                res.status(404).json({ message: 'Person not found' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error fetching person', error: error.message });
        }
    },

    // Update a person
    async updatePerson(req, res) {
        try {
            const personId = req.params.id;
            const updateData = req.body;
            const result = await Person.updateById(personId, updateData, dbConnection);
            res.status(200).json({ message: 'Person updated successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error updating person', error: error.message });
        }
    },

    // Delete a person
    async deletePerson(req, res) {
        try {
            const personId = req.params.id;
            const result = await Person.deleteById(personId, dbConnection);
            res.status(200).json({ message: 'Person deleted successfully', data: result });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting person', error: error.message });
        }
    }
};

export default personController;
