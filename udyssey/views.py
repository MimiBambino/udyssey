from udyssey import app
from flask import Flask, flash, jsonify, redirect, render_template,\
                  request, session, url_for


# error handlers
def bad_request(message):
    response = jsonify({'message': message})
    response.status_code = 400
    return response


# routes
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/optimize', methods=['POST'])
def optimize():

    if not request.json:
        return bad_request('No JSON attached.')

    is_valid_request, error_message = check_optimize_request(request)
    if not is_valid_request:
        return bad_request(error_message)

    # TODO: call the olson module to optimize route
    # ordered_locations = olson.optimize(locations)
    # return jsonify(ordered_locations)

    return jsonify(request.json)


# helper methods
def check_optimize_request(request):
    """ checks if an optimization request is valid
    params:
    - request: Request object

    return:
    - boolean: if valid
    - string: error message
    """
    # should have a locations object/array
    try:
        locations = request.json['locations']

    except Exception:
        return (False, 'No locations found.')

    # each location should have a lat and lon
    # one and only one of the locations is listed as home
    has_home = False
    for location in locations:
        if 'home' in location and location['home']:
            if has_home:
                return (False, 'Duplicate homes found.')
            else:
                has_home = True
        if 'lat' not in location or 'lon' not in location:
            return (False, 'Each location should have a lat and lon.')

    if not has_home:
        return (False, 'At least one location needs to be listed as home.')

    return (True, None)