import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import styles from './Login.module.css'
import { useNavigate } from 'react-router'
import { url } from '@/utils/constant'

interface LoginFormValues {
    email: string
    password: string
}

const loginValidationSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
})

const initialValues: LoginFormValues = {
    email: '',
    password: '',
}

export function Login() {
    const navigate = useNavigate();
    const handleSubmit = async (values: LoginFormValues, { setSubmitting }: any) => {
        try {
            // TODO: Implement login API call here
            console.log('Login attempt:', values)
        } catch (error) {
            console.error('Login failed:', error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={styles.loginContainer}>
            <div className={styles.formWrapper}>
                <h1 className={styles.title}>Log In</h1>
                <p className={styles.subtitle}>Welcome back to the Casino</p>

                <Formik
                    initialValues={initialValues}
                    validationSchema={loginValidationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, isValid, dirty }) => (
                        <Form className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="email" className={styles.label}>
                                    Email Address
                                </label>
                                <Field
                                    type="email"
                                    id="email"
                                    name="email"
                                    className={styles.input}
                                    placeholder="Enter your email"
                                />
                                <ErrorMessage
                                    name="email"
                                    component="div"
                                    className={styles.error}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="password" className={styles.label}>
                                    Password
                                </label>
                                <Field
                                    type="password"
                                    id="password"
                                    name="password"
                                    className={styles.input}
                                    placeholder="Enter your password"
                                />
                                <ErrorMessage
                                    name="password"
                                    component="div"
                                    className={styles.error}
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isSubmitting || !isValid || !dirty}
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign In'}
                            </button>
                        </Form>
                    )}
                </Formik>

                <div className={styles.footer}>
                    <div>Don't have an account? <span onClick={() => navigate(url.signup)} className={styles.link}>Sign up</span></div>
                    {/* <p><a href="#forgot" className={styles.link}>Forgot password?</a></p> */}
                </div>
            </div>
        </div>
    )
}
