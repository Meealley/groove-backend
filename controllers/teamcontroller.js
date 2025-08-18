const asyncHandler = require("express-async-handler");
const User = require("../models/UserModel");

// @desc    Get user's teams
// @route   GET /api/teams
// @access  Private
const getUserTeams = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('team.teams.teamId', 'name description members')
    .select('team.teams');
  
  res.status(200).json({
    success: true,
    data: user.team.teams
  });
});

// @desc    Update team role for user
// @route   PUT /api/teams/:teamId/members/:userId/role
// @access  Private
const updateTeamMemberRole = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  const { role } = req.body;
  
  const validRoles = ['owner', 'admin', 'member', 'viewer'];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  // Check if current user has permission to modify roles
  const currentUser = await User.findById(req.user._id);
  const userTeam = currentUser.team.teams.find(t => t.teamId.toString() === teamId);
  
  if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
    res.status(403);
    throw new Error("Insufficient permissions to modify team roles");
  }

  // Update the target user's role
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const targetTeam = targetUser.team.teams.find(t => t.teamId.toString() === teamId);
  if (!targetTeam) {
    res.status(404);
    throw new Error("User is not a member of this team");
  }

  // Prevent owner from changing their own role
  if (req.user._id.toString() === userId && userTeam.role === 'owner') {
    res.status(400);
    throw new Error("Team owner cannot change their own role");
  }

  targetTeam.role = role;
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: "Team member role updated successfully",
    data: {
      userId,
      teamId,
      newRole: role
    }
  });
});

// @desc    Add user to team
// @route   POST /api/teams/:teamId/members
// @access  Private
const addTeamMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { email, role = 'member' } = req.body;
  
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  // Check if current user has permission to add members
  const currentUser = await User.findById(req.user._id);
  const userTeam = currentUser.team.teams.find(t => t.teamId.toString() === teamId);
  
  if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
    res.status(403);
    throw new Error("Insufficient permissions to add team members");
  }

  // Find the user to add
  const targetUser = await User.findOne({ email });
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found with this email");
  }

  // Check if user is already a team member
  const existingMembership = targetUser.team.teams.find(t => t.teamId.toString() === teamId);
  if (existingMembership) {
    res.status(400);
    throw new Error("User is already a member of this team");
  }

  // Check team member limits based on subscription
  const teamMemberCount = await User.countDocuments({
    'team.teams.teamId': teamId
  });

  if (!currentUser.checkLimit('teamMembers') || teamMemberCount >= currentUser.subscription.limits.teamMembers) {
    res.status(403);
    throw new Error("Team member limit reached for your subscription plan");
  }

  // Add user to team
  targetUser.team.teams.push({
    teamId,
    role,
    joinedAt: new Date(),
    permissions: getDefaultPermissions(role)
  });

  await targetUser.save();

  res.status(200).json({
    success: true,
    message: "User added to team successfully",
    data: {
      userId: targetUser._id,
      email: targetUser.email,
      teamId,
      role
    }
  });
});

// @desc    Remove user from team
// @route   DELETE /api/teams/:teamId/members/:userId
// @access  Private
const removeTeamMember = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  
  // Check if current user has permission to remove members
  const currentUser = await User.findById(req.user._id);
  const userTeam = currentUser.team.teams.find(t => t.teamId.toString() === teamId);
  
  if (!userTeam || !['owner', 'admin'].includes(userTeam.role)) {
    res.status(403);
    throw new Error("Insufficient permissions to remove team members");
  }

  // Prevent owner from removing themselves
  if (req.user._id.toString() === userId && userTeam.role === 'owner') {
    res.status(400);
    throw new Error("Team owner cannot remove themselves");
  }

  // Remove user from team
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const teamIndex = targetUser.team.teams.findIndex(t => t.teamId.toString() === teamId);
  if (teamIndex === -1) {
    res.status(404);
    throw new Error("User is not a member of this team");
  }

  targetUser.team.teams.splice(teamIndex, 1);
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: "User removed from team successfully",
    data: {
      userId,
      teamId
    }
  });
});

// @desc    Update collaboration preferences
// @route   PUT /api/teams/collaboration-preferences
// @access  Private
const updateCollaborationPreferences = asyncHandler(async (req, res) => {
  const { shareProgressUpdates, allowTaskAssignment, showAvailability, defaultShareLevel } = req.body;
  
  const updates = {};
  if (shareProgressUpdates !== undefined) updates['team.collaboration.shareProgressUpdates'] = shareProgressUpdates;
  if (allowTaskAssignment !== undefined) updates['team.collaboration.allowTaskAssignment'] = allowTaskAssignment;
  if (showAvailability !== undefined) updates['team.collaboration.showAvailability'] = showAvailability;
  if (defaultShareLevel !== undefined) {
    const validLevels = ['private', 'team', 'organization'];
    if (!validLevels.includes(defaultShareLevel)) {
      res.status(400);
      throw new Error("Invalid share level");
    }
    updates['team.collaboration.defaultShareLevel'] = defaultShareLevel;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Collaboration preferences updated successfully",
    data: user.team.collaboration
  });
});

// @desc    Get team members
// @route   GET /api/teams/:teamId/members
// @access  Private
const getTeamMembers = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  
  // Check if user is a member of this team
  const currentUser = await User.findById(req.user._id);
  const userTeam = currentUser.team.teams.find(t => t.teamId.toString() === teamId);
  
  if (!userTeam) {
    res.status(403);
    throw new Error("You are not a member of this team");
  }

  // Get all team members
  const teamMembers = await User.find({
    'team.teams.teamId': teamId,
    'admin.status': 'active'
  }).select('name email profile.avatar profile.title profile.company team.teams.$ activity.lastActiveDate');

  // Format the response
  const formattedMembers = teamMembers.map(member => {
    const memberTeam = member.team.teams.find(t => t.teamId.toString() === teamId);
    return {
      _id: member._id,
      name: member.name,
      email: member.email,
      avatar: member.profile.avatar,
      title: member.profile.title,
      company: member.profile.company,
      role: memberTeam.role,
      joinedAt: memberTeam.joinedAt,
      lastActive: member.activity.lastActiveDate,
      isOnline: member.isOnline()
    };
  });

  res.status(200).json({
    success: true,
    data: {
      teamId,
      members: formattedMembers,
      totalMembers: formattedMembers.length
    }
  });
});

// @desc    Leave team
// @route   DELETE /api/teams/:teamId/leave
// @access  Private
const leaveTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  
  const user = await User.findById(req.user._id);
  const teamIndex = user.team.teams.findIndex(t => t.teamId.toString() === teamId);
  
  if (teamIndex === -1) {
    res.status(404);
    throw new Error("You are not a member of this team");
  }

  const userTeam = user.team.teams[teamIndex];
  
  // Prevent owner from leaving if there are other members
  if (userTeam.role === 'owner') {
    const memberCount = await User.countDocuments({
      'team.teams.teamId': teamId
    });
    
    if (memberCount > 1) {
      res.status(400);
      throw new Error("Team owner cannot leave team with other members. Transfer ownership first.");
    }
  }

  user.team.teams.splice(teamIndex, 1);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Successfully left the team",
    data: {
      teamId,
      userId: user._id
    }
  });
});

// @desc    Transfer team ownership
// @route   PUT /api/teams/:teamId/transfer-ownership
// @access  Private
const transferOwnership = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { newOwnerId } = req.body;
  
  if (!newOwnerId) {
    res.status(400);
    throw new Error("New owner ID is required");
  }

  // Check if current user is the owner
  const currentUser = await User.findById(req.user._id);
  const userTeam = currentUser.team.teams.find(t => t.teamId.toString() === teamId);
  
  if (!userTeam || userTeam.role !== 'owner') {
    res.status(403);
    throw new Error("Only team owner can transfer ownership");
  }

  // Find the new owner
  const newOwner = await User.findById(newOwnerId);
  if (!newOwner) {
    res.status(404);
    throw new Error("New owner not found");
  }

  const newOwnerTeam = newOwner.team.teams.find(t => t.teamId.toString() === teamId);
  if (!newOwnerTeam) {
    res.status(400);
    throw new Error("New owner is not a member of this team");
  }

  // Transfer ownership
  userTeam.role = 'admin';
  newOwnerTeam.role = 'owner';

  await Promise.all([currentUser.save(), newOwner.save()]);

  res.status(200).json({
    success: true,
    message: "Ownership transferred successfully",
    data: {
      teamId,
      previousOwner: req.user._id,
      newOwner: newOwnerId
    }
  });
});

// Helper function to get default permissions based on role
const getDefaultPermissions = (role) => {
  const permissions = {
    owner: ['all'],
    admin: ['manage_members', 'manage_projects', 'view_analytics'],
    member: ['create_tasks', 'edit_own_tasks', 'view_team_tasks'],
    viewer: ['view_team_tasks']
  };
  
  return permissions[role] || permissions.member;
};

module.exports = {
  getUserTeams,
  updateTeamMemberRole,
  addTeamMember,
  removeTeamMember,
  updateCollaborationPreferences,
  getTeamMembers,
  leaveTeam,
  transferOwnership
};