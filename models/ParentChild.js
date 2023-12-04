class ParentChild {
    constructor(parentId, childId, relationshipType) {
        this.parentId = parentId;
        this.childId = childId;
        this.relationshipType = relationshipType;
    }

    // Create a new parent-child relationship
    static async create(relationData, dbConnection) {
        try {
            const query = 'INSERT INTO ParentChild (ParentId, ChildId, RelationshipType) VALUES (?, ?, ?)';
            const results = await dbConnection.query(query, [relationData.parentId, relationData.childId, relationData.relationshipType]);
            return results;
        } catch (error) {
            console.error('Error in ParentChild.create:', error);
            throw error; // Rethrow the error for further handling if needed
        }
    }

    // Get child by parent ID
    static async getChildrenByParentId(parentId, dbConnection) {
        try {
            const query = 'SELECT * FROM ParentChild WHERE ParentId = ?';
            const [rows] = await dbConnection.query(query, [parentId]);
            return rows;
        } catch (error) {
            console.error('Error in ParentChild.getChildrenByParentId:', error);
            throw error;
        }
    }

    // Get parent by child ID
    static async getParentsByChildId(childId, dbConnection) {
        try {
            const query = 'SELECT * FROM ParentChild WHERE ChildId = ?';
            const [rows] = await dbConnection.query(query, [childId]);
            return rows;
        } catch (error) {
            console.error('Error in ParentChild.getParentsByChildId:', error);
            throw error;
        }
    }

    // Delete a parent-child relationship
    static async deleteByIds(relationId, dbConnection) {
        try {
            const query = 'DELETE FROM ParentChild WHERE ParentId = ? AND ChildId = ?';
            const results = await dbConnection.query(query, [relationId.parentId, relationId.childId]);
            return results;
        } catch (error) {
            console.error('Error in ParentChild.delete:', error);
            throw error;
        }
    }
}

export default ParentChild;
