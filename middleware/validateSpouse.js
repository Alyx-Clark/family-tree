const validateSpouse = (req, res, next) => {
    const { husbandId, wifeId, marriageDate, divorceDate, status } = req.body;

    if (!husbandId || isNaN(parseInt(husbandId))) {
        return res.status(400).json({ message: 'Valid Husband ID is required' });
    }

    if (!wifeId || isNaN(parseInt(wifeId))) {
        return res.status(400).json({ message: 'Valid Wife ID is required' });
    }

    if (marriageDate && isNaN(Date.parse(marriageDate))) {
        return res.status(400).json({ message: 'Invalid marriage date format' });
    }

    if (divorceDate && isNaN(Date.parse(divorceDate))) {
        return res.status(400).json({ message: 'Invalid divorce date format' });
    }

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    next(); // Proceed if validation passes
};

export default validateSpouse;
