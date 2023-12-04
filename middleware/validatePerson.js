const validatePerson = (req, res, next) => {
    const { name, birthday, deathdate, placeOfBirth, aboutMe, isActive } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    if (birthday && isNaN(Date.parse(birthday))) {
        return res.status(400).json({ message: 'Invalid birthday format' });
    }

    if (deathdate && isNaN(Date.parse(deathdate))) {
        return res.status(400).json({ message: 'Invalid deathdate format' });
    }

    if (isActive !== undefined && typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'IsActive must be a boolean' });
    }

    next(); // Proceed to the next middleware/controller if validation passes
};

export default validatePerson;
