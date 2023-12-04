const validatePhoto = (req, res, next) => {
    const { photoUrl, description, personId } = req.body;

    if (!photoUrl) {
        return res.status(400).json({ message: 'Photo URL is required' });
    }

    // More validations can be added here, e.g., checking URL format, description length, etc.

    if (!personId || isNaN(parseInt(personId))) {
        return res.status(400).json({ message: 'Valid Person ID is required' });
    }

    next(); // Proceed if validation passes
};

export default validatePhoto;
