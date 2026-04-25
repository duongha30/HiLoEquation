import { Home, Room, Login, Signup } from '@/screens';
import { url } from '@/utils/constant';
import { Routes, Route, Navigate, useParams, useLocation } from "react-router";
import { AuthRouter } from './AuthRoute';
import { selectUserId } from '@/store';
import { useCheckInternetConnection } from '@/hooks';
import { useAppSelector } from '@/store/hooks';

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const isLoggedIn = useAppSelector(selectUserId);
  const location = useLocation()
  const { isOnline } = useCheckInternetConnection();

  if (!isOnline) {
    //TODO: Show loading
    return null;
  }

  if (!isLoggedIn) {
    if (location.pathname !== url.login && location.pathname !== url.signup) {
      return <Navigate to={url.login} replace />;
    } else {
      return <AuthRouter />;
    }
  }

  return children;
};

export default function MainRouters() {
  return (
    <>
      {/* <AuthRouter />
      <PrivateRoute> */}
      <Routes>
        <Route path={url.home} element={<Home />} />
        <Route path={url.room} element={<Room />} />
      </Routes>
      {/* </PrivateRoute> */}
    </>
  )
}
