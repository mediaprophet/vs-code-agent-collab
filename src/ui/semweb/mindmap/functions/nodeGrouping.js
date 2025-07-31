// Node Grouping Helper Functions
// Usage: import * as nodeGrouping from './nodeGrouping.js';

/**
 * Assign a group to a set of nodes.
 * @param {Array} nodes - Array of node objects.
 * @param {string} group - Group name to assign.
 */
export function assignGroup(nodes, group) {
  nodes.forEach(node => {
    node.group = group;
  });
}

/**
 * Remove group from a set of nodes.
 * @param {Array} nodes - Array of node objects.
 */
export function clearGroup(nodes) {
  nodes.forEach(node => {
    delete node.group;
  });
}

/**
 * Get all unique group names in the mindmap.
 * @param {Array} nodes - Array of node objects.
 * @returns {Array<string>} Array of group names.
 */
export function getAllGroups(nodes) {
  return Array.from(new Set(nodes.map(n => n.group).filter(Boolean)));
}

/**
 * Get all nodes in a specific group.
 * @param {Array} nodes - Array of node objects.
 * @param {string} group - Group name.
 * @returns {Array} Array of nodes in the group.
 */
export function getNodesInGroup(nodes, group) {
  return nodes.filter(n => n.group === group);
}
