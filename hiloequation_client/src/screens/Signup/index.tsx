import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import styles from './Signup.module.css'
import { useNavigate } from 'react-router'
import { url } from '@/utils/constant'

interface SignupFormValues {
    username: string
    email: string
    password: string
    confirmPassword: string
    agreeToTerms: boolean
}

const signupValidationSchema = Yup.object().shape({
    username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must not exceed 20 characters')
        .required('Username is required')
        .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
    agreeToTerms: Yup.boolean()
        .oneOf([true], 'You must agree to the terms and conditions'),
})

const initialValues: SignupFormValues = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
}

export const Signup = () => {
    const navigate = useNavigate();
    const handleSubmit = async (values: SignupFormValues, { setSubmitting }: any) => {
        try {
            // TODO: Implement signup API call here
            console.log('Signup attempt:', values)
        } catch (error) {
            console.error('Signup failed:', error)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={styles.signupContainer}>
            <div className={styles.formWrapper}>
                <h1 className={styles.title}>Create Account</h1>
                <p className={styles.subtitle}>Join the Casino today</p>

                <Formik
                    initialValues={initialValues}
                    validationSchema={signupValidationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, isValid, dirty }) => (
                        <Form className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="username" className={styles.label}>
                                    Username1223
                                </label>
                                <Field
                                    type="text"
                                    id="username"
                                    name="username"
                                    className={styles.input}
                                    placeholder="Choose a username"
                                />
                                <ErrorMessage
                                    name="username"
                                    component="div"
                                    className={styles.error}
                                />
                            </div>

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
                                    placeholder="Create a strong password"
                                />
                                <ErrorMessage
                                    name="password"
                                    component="div"
                                    className={styles.error}
                                />
                                <div className={styles.passwordHint}>
                                    Password must contain at least 8 characters, uppercase, lowercase, and a number
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword" className={styles.label}>
                                    Confirm Password
                                </label>
                                <Field
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className={styles.input}
                                    placeholder="Confirm your password"
                                />
                                <ErrorMessage
                                    name="confirmPassword"
                                    component="div"
                                    className={styles.error}
                                />
                            </div>

                            <div className={styles.checkboxGroup}>
                                <label htmlFor="agreeToTerms" className={styles.checkboxLabel}>
                                    <Field
                                        type="checkbox"
                                        id="agreeToTerms"
                                        name="agreeToTerms"
                                        className={styles.checkbox}
                                    />
                                    <span>I agree to the Terms and Conditions</span>
                                </label>
                                <ErrorMessage
                                    name="agreeToTerms"
                                    component="div"
                                    className={styles.error}
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isSubmitting || !isValid || !dirty}
                            >
                                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </Form>
                    )}
                </Formik>

                <div className={styles.footer}>
                    <div>Already have an account? <span onClick={() => navigate(url.login)} className={styles.link}>Log in</span></div>
                </div>
            </div>
        </div>
    )
}
