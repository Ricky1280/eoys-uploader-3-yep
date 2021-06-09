const {
  collect_all_tags,
  collect_all_posts,
  collect_all_draft_posts,
} = require('./wp/collect.js')

const {
  create,
  edit,
  createMedia,
} = require('./wp/create.js')

const {
  filterCategory,
  filterTag,
  filterPost,
  hydratePostByType
} = require('./wp/filters.js')

const {
  generate_limited_random,
  generateSlug,
  refresh,
  lastUpdateTime
} = require('./wp/utils.js')

const {
  getPostById,
  getLivePostById,
  getMediaById,
  getCategoryById,
  getCategoryByName,
  getAllCategories,
  getAllTags,
  getAllTagsRaw,
  getTagByName,
  getAllPosts,
  getPostsBySearch,
  getPostsByTags,
  getPostsByEmail,
  getPostsCountByTags,
  getPostsCount,
  query
} = require('./wp/get.js')

const {
  getPostsByProject,
  getProjectsSubmissions,
  getProjectsStudents,
  getProjectNameFromSlug
} = require('./wp/projects.js')

module.exports = {
  collect_all_tags,
  collect_all_posts,
  generate_limited_random,
  filterCategory,
  filterTag,
  filterPost,
  getPostById,
  getLivePostById,
  getMediaById,
  getCategoryById,
  getCategoryByName,
  getAllCategories,
  getAllTags,
  getAllTagsRaw,
  getTagByName,
  create,
  createMedia,
  getAllPosts,
  getPostsBySearch,
  getPostsByTags,
  refresh,
  lastUpdateTime,
  query,
  getPostsByProject,
  getProjectsSubmissions,
  getProjectsStudents,
  getProjectNameFromSlug,
  generateSlug,
  getPostsByEmail,
  getPostsCountByTags,
  getPostsCount,
  hydratePostByType,
  edit
}