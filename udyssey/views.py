from udyssey import app
from flask import Flask, flash, jsonify, redirect, render_template,\
                  request, session, url_for

@app.route('/')
def index():
    return render_template('index.html')