import pytest
from app import create_app, db
from models.user import User

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'
    app.config['WTF_CSRF_ENABLED'] = False
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_user_creation(app):
    with app.app_context():
        u = User(username='testuser', email='test@example.com')
        u.set_password('cat')
        db.session.add(u)
        db.session.commit()
        
        fetched = User.query.filter_by(username='testuser').first()
        assert fetched is not None
        assert fetched.check_password('cat')
        assert not fetched.check_password('dog')
        assert fetched.role == 'mechanic' # default

def test_login(client, app):
    with app.app_context():
        u = User(username='testlogin', email='login@example.com')
        u.set_password('securepass')
        db.session.add(u)
        db.session.commit()

    response = client.post('/login', data={'username': 'testlogin', 'password': 'securepass'}, follow_redirects=True)
    assert response.status_code == 200
    assert b'Logout' in response.data

    response = client.get('/logout', follow_redirects=True)
    assert response.status_code == 200
    assert b'Login' in response.data
