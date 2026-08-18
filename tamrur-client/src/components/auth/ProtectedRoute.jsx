// React

// External libraries
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// Internal application modules
import { ROLE_HOME_ROUTES } from "../../constants/roles";

// Styles

/**
 * Gates a route to a set of allowed roles. Redirects to login if no user is
 * logged in, or to the current user's own home route if their role isn't in
 * `allowedRoles`.
 *
 * @param {Object} props
 * @param {string[]} props.allowedRoles
 * @param {import("react").ReactNode} props.children
 * @returns {JSX.Element}
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME_ROUTES[user.role] ?? "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
