/**
 * The audit action for a spec that cleared its review without a person.
 *
 * In its own module so a surface that LISTS these can name the action without
 * importing a server file, which is the same split `AUTO_APPROVED_ACTION` should
 * have had and did not.
 */
export const AUTO_CLEARED_ACTION = "spec.auto_cleared";
