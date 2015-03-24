"""
Road trip optimizer

Attribution: Randal S. Olson

The following code is adapted from Randal S. Olson's, "Computing the optimal
road trip across the U.S." available at:

http://nbviewer.ipython.org/github/rhiever/Data-Analysis-and-Machine-Learning-Projects/blob/master/optimal-road-trip/Computing%20the%20optimal%20road%20trip%20across%20the%20U.S..ipynb

It is usable under the terms of the BSD license and the Creative Commons
Attribution 3.0 Unported License.

Modifications made were to support integration with a Flask web application.
"""

# TODO: abstract out iPython notebook into usable methods for use in API

import googlemaps
import numpy as np
import pandas as pd
import random

from itertools import combinations

# Invoke Google Maps

gmaps = googlemaps.Client(key="AIzaSyDfvx3mjNX3kjZ1lUnS_plF8MqymI6I8Ec")

# Gather the distance traveled on the shortest route between all waypoints

def find_paired_data(waypoints):
    """ takes a list of waypoints, and finds the driving distance and
    duration between each combination of two """

    waypoint_distances = {}
    waypoint_durations = {}

    num_errors = 0
    for (waypoint1, waypoint2) in combinations(waypoints, 2):
        # check if waypoint pair exists in database
            # TODO: if it does, query the data and add to waypoint_distances + waypoint_durations
            # if not query gmaps.distance_matrix
        try:
            route = gmaps.distance_matrix(origins=[waypoint1],
                                          destinations=[waypoint2],
                                          #TODO: change waypoint format to lat/lon
                                          mode="driving",
                                          language="English",
                                          units="metric")

            # "distance" is in meters
            distance = route["rows"][0]["elements"][0]["distance"]["value"]

            # "duration" is in seconds
            duration = route["rows"][0]["elements"][0]["duration"]["value"]

            waypoint_distances[frozenset([waypoint1, waypoint2])] = distance
            waypoint_durations[frozenset([waypoint1, waypoint2])] = duration

        except Exception as e:
            num_errors += 1
            print("Error with finding the route between %s and %s." % (waypoint1, waypoint2))
            if num_errors >= 10:
                print("More than {} errors, exiting program.".format(num_errors))

    return waypoint_distances, waypoint_durations

    # NOTE: legacy code from file-reading and writing
    # with open("my-waypoints-dist-dur.tsv", "wb") as out_file:
    #     out_file.write("\t".join(["waypoint1",
    #                               "waypoint2",
    #                               "distance_m",
    #                               "duration_s"]))

    #     for (waypoint1, waypoint2) in waypoint_distances.keys():
    #         out_file.write("\n" +
    #                        "\t".join([waypoint1,
    #                                   waypoint2,
    #                                   str(waypoint_distances[frozenset([waypoint1, waypoint2])]),
    #                                   str(waypoint_durations[frozenset([waypoint1, waypoint2])])]))

def compute_fitness(solution):
    """
        This function returns the total distance traveled on the current road trip.

        The genetic algorithm will favor road trips that have shorter
        total distances traveled.
    """

    solution_fitness = 0.0

    for index in range(len(solution)):
        waypoint1 = solution[index - 1]
        waypoint2 = solution[index]
        solution_fitness += waypoint_distances[frozenset([waypoint1, waypoint2])]

    return solution_fitness

def generate_random_agent(all_waypoints):
    """
        Creates a random road trip from the waypoints.
    """

    new_random_agent = list(all_waypoints)
    random.shuffle(new_random_agent)
    return tuple(new_random_agent)

def mutate_agent(agent_genome, max_mutations=3):
    """
        Applies 1 - `max_mutations` point mutations to the given road trip.

        A point mutation swaps the order of two waypoints in the road trip.
    """

    agent_genome = list(agent_genome)
    num_mutations = random.randint(1, max_mutations)

    for mutation in range(num_mutations):
        swap_index1 = random.randint(0, len(agent_genome) - 1)
        swap_index2 = swap_index1

        while swap_index1 == swap_index2:
            swap_index2 = random.randint(0, len(agent_genome) - 1)

        agent_genome[swap_index1], agent_genome[swap_index2] = agent_genome[swap_index2], agent_genome[swap_index1]

    return tuple(agent_genome)

def shuffle_mutation(agent_genome):
    """
        Applies a single shuffle mutation to the given road trip.

        A shuffle mutation takes a random sub-section of the road trip
        and moves it to another location in the road trip.
    """

    agent_genome = list(agent_genome)

    start_index = random.randint(0, len(agent_genome) - 1)
    length = random.randint(2, 20)

    genome_subset = agent_genome[start_index:start_index + length]
    agent_genome = agent_genome[:start_index] + agent_genome[start_index + length:]

    insert_index = random.randint(0, len(agent_genome) + len(genome_subset) - 1)
    agent_genome = agent_genome[:insert_index] + genome_subset + agent_genome[insert_index:]

    return tuple(agent_genome)

def generate_random_population(pop_size):
    """
        Generates a list with `pop_size` number of random road trips.
    """

    random_population = []
    for agent in range(pop_size):
        random_population.append(generate_random_agent())
    return random_population

def run_genetic_algorithm(generations=5000, population_size=100):
    """
        The core of the Genetic Algorithm.
    """

    # Create a random population of `population_size` number of solutions.
    population = generate_random_population(population_size)

    # For `generations` number of repetitions...
    for generation in range(generations):

        # Compute the fitness of the entire current population
        population_fitness = {}

        for agent_genome in population:
            if agent_genome in population_fitness:
                continue

            population_fitness[agent_genome] = compute_fitness(agent_genome)

        # Take the 10 shortest road trips and produce 10 offspring each from them
        new_population = []
        for rank, agent_genome in enumerate(sorted(population_fitness, key=population_fitness.get)[:10]):
            if (generation % 1000 == 0 or generation == generations - 1) and rank == 0:
                print("Generation %d best: %d | Unique genomes: %d" % (generation,
                                                                       population_fitness[agent_genome],
                                                                       len(population_fitness)))
                print(agent_genome)
                print("")

            # Create 1 exact copy of each of the top 10 road trips
            new_population.append(agent_genome)

            # Create 2 offspring with 1-3 point mutations
            for offspring in range(2):
                new_population.append(mutate_agent(agent_genome, 3))

            # Create 7 offspring with a single shuffle mutation
            for offspring in range(7):
                new_population.append(shuffle_mutation(agent_genome))

        # Replace the old population with the new population of offspring
        for i in range(len(population))[::-1]:
            del population[i]

        population = new_population

    # TODO: this function needs to return the optimal route!

# TODO: build out optimize function to talk with API
def optimize(locations):
    """ takes a list of locations, runs a genetic algorithm, and returns
    an ordered list of the most optimal locations in order """

    ordered_locations = locations
    return ordered_locations

def temporary():

    # Running the genetic algorithm

    run_genetic_algorithm(generations=5000, population_size=100)

    # Visualize your road trip on a Google Map

    optimal_route = ('Graceland, Elvis Presley Boulevard, Memphis, TN', 'Vicksburg National Military Park, Clay Street, Vicksburg, MS', 'French Quarter, New Orleans, LA', 'USS Alabama, Battleship Parkway, Mobile, AL', 'Cape Canaveral, FL', 'Okefenokee Swamp Park, Okefenokee Swamp Park Road, Waycross, GA', "Fort Sumter National Monument, Sullivan's Island, SC", 'Wright Brothers National Memorial Visitor Center, Manteo, NC', 'Congress Hall, Congress Place, Cape May, NJ 08204', 'Shelburne Farms, Harbor Road, Shelburne, VT', 'Omni Mount Washington Resort, Mount Washington Hotel Road, Bretton Woods, NH', 'Acadia National Park, Maine', 'USS Constitution, Boston, MA', 'The Breakers, Ochre Point Avenue, Newport, RI', 'The Mark Twain House & Museum, Farmington Avenue, Hartford, CT', 'Statue of Liberty, Liberty Island, NYC, NY', 'Liberty Bell, 6th Street, Philadelphia, PA', 'New Castle Historic District, Delaware', 'Maryland State House, 100 State Cir, Annapolis, MD 21401', 'White House, Pennsylvania Avenue Northwest, Washington, DC', 'Mount Vernon, Fairfax County, Virginia', 'Lost World Caverns, Lewisburg, WV', 'Olympia Entertainment, Woodward Avenue, Detroit, MI', 'Spring Grove Cemetery, Spring Grove Avenue, Cincinnati, OH', 'Mammoth Cave National Park, Mammoth Cave Pkwy, Mammoth Cave, KY', 'West Baden Springs Hotel, West Baden Avenue, West Baden Springs, IN', 'Gateway Arch, Washington Avenue, St Louis, MO', 'Lincoln Home National Historic Site Visitor Center, 426 South 7th Street, Springfield, IL', 'Taliesin, County Road C, Spring Green, Wisconsin', 'Fort Snelling, Tower Avenue, Saint Paul, MN', 'Terrace Hill, Grand Avenue, Des Moines, IA', 'C. W. Parker Carousel Museum, South Esplanade Street, Leavenworth, KS', 'Ashfall Fossil Bed, Royal, NE', 'Mount Rushmore National Memorial, South Dakota 244, Keystone, SD', 'Fort Union Trading Post National Historic Site, Williston, North Dakota 1804, ND', 'Glacier National Park, West Glacier, MT', 'Yellowstone National Park, WY 82190', 'Craters of the Moon National Monument & Preserve, Arco, ID', 'Hanford Site, Benton County, WA', 'Columbia River Gorge National Scenic Area, Oregon', 'Cable Car Museum, 94108, 1201 Mason St, San Francisco, CA 94108', 'San Andreas Fault, San Benito County, CA', 'Hoover Dam, NV', 'Grand Canyon National Park, Arizona', 'Bryce Canyon National Park, Hwy 63, Bryce, UT', 'Pikes Peak, Colorado', 'Carlsbad Caverns National Park, Carlsbad, NM', 'The Alamo, Alamo Plaza, San Antonio, TX', 'Chickasaw National Recreation Area, 1008 W 2nd St, Sulphur, OK 73086', 'Toltec Mounds, Scott, AR')

    optimal_route = list(optimal_route)
    optimal_route += [optimal_route[0]]
    subset = 0

    while subset < len(optimal_route):

        waypoint_subset = optimal_route[subset:subset + 10]
        output = "calcRoute(\"%s\", \"%s\", [" % (waypoint_subset[0], waypoint_subset[-1])
        for waypoint in waypoint_subset[1:-1]:
            output += "\"%s\", " % (waypoint)

        if len(waypoint_subset[1:-1]) > 0:
            output = output[:-2]

        output += "]);"
        print(output)
        print("")
        subset += 9


def test_find_paired_data(test_waypoints):
    num_pairs = len(list(combinations(test_waypoints, 2)))
    result = find_paired_data(test_waypoints)
    assert len(result[0]) == len(result[1]) == num_pairs,"function did not return correct number of pairs"


def test_compute_fitness(test_waypoints):
    pass

if __name__ == '__main__':
    # Fixtures for SIX road trip waypoints
    test_waypoints = ["USS Alabama, Battleship Parkway, Mobile, AL",
                     "Grand Canyon National Park, Arizona",
                     "Toltec Mounds, Scott, AR",
                     "San Andreas Fault, San Benito County, CA",
                     "Cable Car Museum, 94108, 1201 Mason St, San Francisco, CA 94108",
                     "Pikes Peak, Colorado"]

    # test_find_paired_data(test_waypoints)
    test_compute_fitness()
