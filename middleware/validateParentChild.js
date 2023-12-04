const validateParentChild = (req, res, next) => {
    const { parentId, childId, relationshipType } = req.body;

    if (!parentId || isNaN(parseInt(parentId))) {
        return res.status(400).json({ message: 'Valid Parent ID is required' });
    }

    if (!childId || isNaN(parseInt(childId))) {
        return res.status(400).json({ message: 'Valid Child ID is required' });
    }

    if (!relationshipType) {
        return res.status(400).json({ message: 'Relationship type is required' });
    }

    next(); // Proceed if validation passes
};

export default validateParentChild;
