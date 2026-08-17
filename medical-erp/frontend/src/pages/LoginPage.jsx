import LoginForm from '../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-page__bg" />
      <div className="login-page__content">
        <LoginForm />
      </div>
    </div>
  );
}
