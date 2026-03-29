const Department = require('../models/Department');
const RoutingConfig = require('../models/RoutingConfig');
const User = require('../models/User');

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    const department = await Department.create({ name, code });
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getRoutingConfigs = async (req, res) => {
  try {
    const configs = await RoutingConfig.find().populate('departmentId', 'name code');
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createOrUpdateRoutingConfig = async (req, res) => {
  try {
    const { departmentId, primaryApproverEmail, roleType } = req.body;
    let config = await RoutingConfig.findOne({ departmentId, roleType });
    if (config) {
      config.primaryApproverEmail = primaryApproverEmail;
      await config.save();
    } else {
      config = await RoutingConfig.create({ departmentId, primaryApproverEmail, roleType });
    }
    res.status(200).json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('departmentId', 'name code');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignRole = async (req, res) => {
  try {
    const { email, role, departmentId } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        name: 'Pending User',
        password: 'PENDING_USER_NO_PASSWORD',
        role,
        departmentId: departmentId || undefined
      });
      return res.status(200).json({ message: `Pre-assigned! When ${email} registers, they will automatically be a ${role}.`, user });
    }
    user.role = role;
    if (departmentId) user.departmentId = departmentId;
    await user.save();
    res.status(200).json({ message: 'Role assigned successfully to existing user!', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  getRoutingConfigs,
  createOrUpdateRoutingConfig,
  getUsers,
  assignRole
};
