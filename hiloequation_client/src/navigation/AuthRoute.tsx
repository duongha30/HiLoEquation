import { Navigate, Route, Routes } from 'react-router';
import { Signup, Login } from '../screens';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store';
import { url } from '@/utils/constant';

export const AuthRouter = () => {
    const isLoggedIn = useAppSelector(selectUserId);

    if (isLoggedIn) {
        return <Navigate to={url.home} replace />;
    }

    return (
        <Routes>
            <Route path={url.login} element={<Login />} />
            <Route path={url.signup} element={<Signup />} />
        </Routes>
    );
};
