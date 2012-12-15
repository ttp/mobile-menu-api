require 'rubygems'
require 'mongo'
require './quadtree.rb'

include Mongo

client   = MongoClient.new('localhost', 27017)
db       = client['mobilemenu_test']
accounts = db['accounts']
places   = db['places']

puts "clearing accounts..."
accounts.remove

puts "clearing places..."
places.remove

# Ukraine
# left    48.283193,22.159424
# right   48.698212,39.666138
# top     52.001792,33.266602
# bottom  46.747389,33.370972

lat_min = 46.747389
lat_max = 52.001792

lng_min = 22.159424
lng_max = 39.666138


# Rivne
# left    50.622732,26.202908
# right   50.615162,26.287365
# top     50.652508,26.235609
# bottom  50.594191,26.233892

lat_min = 50.594191
lat_max = 50.652508

lng_min = 26.202908
lng_max = 26.287365

types = ['bar', 'cafeteria', 'coffee', 'fastfood', 'pizzaria', 'restaurant']

puts "creating data..."
10.times do |i|
  account_id = accounts.insert({"name" => "test"})
  
  50.times do |j|
    lat = rand(lat_min..lat_max).round(6)
    lng = rand(lng_min..lng_max).round(6)
    place = {
      "account_id" => account_id,
      "name" => "palce #{i} #{j}",
      "description" => "description #{i} #{j}",

      "place_type_code" => types.sample,
      "show_on_map" => true,

      "coord_lat" => lat,
      "coord_lng" => lng,
      "qtree_int" => QuadTree::latLngToQuadInt(lat, lng, 16),

      "verified" => true
    }

    places.insert(place)
    print "." if j % 20 == 0
  end
  puts ""
end