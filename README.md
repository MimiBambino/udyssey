# Udyssey

### About

Web application for planning awesome road trips

### How to Run

1. Clone repo: `git clone https://github.com/mudacity/udyssey.git`
2. cd into udyssey
3. Ensure you have [Python](https://www.python.org/downloads/) and (optional) [virtualenv](http://simononsoftware.com/virtualenv-tutorial/) installed.
4. (Optional) Create a new virtual environment: `virtualenv venv`
5. (Optional) Activate it: `source venv/bin/activate`
6. Install requirements: `pip install -r requirements.txt`
7. Run the server: `python runserver.py`
8. Open up the page in your web browser @ http://localhost:5000/
9. (Optional) You can deactivate the venv with: `deactivate`

### Where to Contribute

1. Front-end:
 - `/udyssey/templates/index.html`
 - `/udyssey/static/css/application.css`
 - `/udyssey/static/js/application.js`
2. Back-end:
 - `/udyssey/__init__.py`
 - `/udyssey/views.py`
 - `/udyssey/olson.py` (machine learning algorithms)
3. Deployment:
 - `/config.py`
 - `/runserver.py`
