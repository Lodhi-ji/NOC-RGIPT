const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment, getRoutingConfigs, createOrUpdateRoutingConfig, getUsers, assignRole } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('Admin'));

router.route('/departments').get(getDepartments).post(createDepartment);
router.route('/routing').get(getRoutingConfigs).post(createOrUpdateRoutingConfig);
router.route('/users').get(getUsers);
router.route('/users/assign-role').put(assignRole);

module.exports = router;
