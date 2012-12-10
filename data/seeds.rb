require 'rubygems'
require 'mongo'
require './quadtree.rb'

include Mongo

client   = MongoClient.new('localhost', 27017)
db       = client['mobilemenu_test']
accounts = db['accounts']
places   = db['places']

accounts.remove
places.remove

# left    48.283193,22.159424
# right   48.698212,39.666138
# top     52.001792,33.266602
# bottom  46.747389,33.370972

lat_min = 46.747389
lat_max = 52.001792

lng_min = 22.159424
lng_max = 39.666138

types = ['bar', 'cafeteria', 'coffee', 'fastfood', 'pizzaria', 'restaurant']


10.times do |i|
  account_id = accounts.insert({"name" => "test"})
  
  10000.times do |i|
    lat = rand(lat_min..lat_max).round(6)
    lng = rand(lng_min..lng_max).round(6)
    place = {
      "account_id" => account_id,
      "name" => "palce #{i}",
      "description" => "description #{i}",

      "place_type_code" => types.sample,
      "show_on_map" => true,

      "coord_lat" => lat,
      "coord_lng" => lng,
      "qtree_int" => QuadTree::latLngToQuadInt(lat, lng, 16),

      "verified" => true
    }

    places.insert(place)
    print "." if i % 100 == 0
  end
  puts ""
end