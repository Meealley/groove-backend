const express = require("express");
const router = express.Router();
const {
  getUserTeams,
  updateTeamMemberRole,
  addTeamMember,
  removeTeamMember,
  updateCollaborationPreferences,
  getTeamMembers,
  leaveTeam,
  transferOwnership
} = require("../controllers/teamcontroller");
const { protect, checkSubscription } = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// Basic Team Operations
// @route   GET /api/teams
// @desc    Get user's teams
// @access  Private
router.get("/", getUserTeams);

// @route   PUT /api/teams/collaboration-preferences
// @desc    Update collaboration preferences
// @access  Private
router.put("/collaboration-preferences", updateCollaborationPreferences);

// Team Member Management
// @route   GET /api/teams/:teamId/members
// @desc    Get team members
// @access  Private
router.get("/:teamId/members", getTeamMembers);

// @route   POST /api/teams/:teamId/members
// @desc    Add user to team (requires team plan)
// @access  Private
router.post("/:teamId/members", checkSubscription("team"), addTeamMember);

// @route   PUT /api/teams/:teamId/members/:userId/role
// @desc    Update team member role
// @access  Private
router.put("/:teamId/members/:userId/role", updateTeamMemberRole);

// @route   DELETE /api/teams/:teamId/members/:userId
// @desc    Remove user from team
// @access  Private
router.delete("/:teamId/members/:userId", removeTeamMember);

// Team Operations
// @route   DELETE /api/teams/:teamId/leave
// @desc    Leave team
// @access  Private
router.delete("/:teamId/leave", leaveTeam);

// @route   PUT /api/teams/:teamId/transfer-ownership
// @desc    Transfer team ownership
// @access  Private
router.put("/:teamId/transfer-ownership", transferOwnership);

module.exports = router;