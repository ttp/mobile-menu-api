class QuadTree
  TILE_SIZE = 256

  def self.encode(x, y, z)
    arr = []
    i = z
    while i > 0 do
      pow = 1 << (i - 1)
      cell = 0
      if ((x & pow) != 0) then
        cell += 1
      end
      if ((y & pow) != 0) then
        cell += 2
      end
      arr << cell
      i -= 1
    end
    return arr.join("")
  end

  def self.latLngToPoint(lat, lng)
    point = {}
    xx = (lng + 180) / 360
    point[:x] = xx * TILE_SIZE
    sinLat = Math.sin(lat * Math::PI / 180)
    yy = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math::PI)
    point[:y] = yy * TILE_SIZE
    return point
  end

  def self.latLngToQuad(lat, lng, len)
    pnt = latLngToPoint(lat, lng)
    tiX = (pnt[:x] * (2**len) / TILE_SIZE).floor
    tiY = (pnt[:y] * (2**len) / TILE_SIZE).floor
    return encode(tiX, tiY, len)
  end

  def self.latLngToQuadBin(lat, lng, len)
    latLngToQuadInt(lat, lng, len).to_s(2).rjust(len * 2, "0")
  end

  def self.latLngToQuadInt(lat, lng, len)
    latLngToQuad(lat, lng, len).to_i(4)
  end

  def self.quadToBin(quad)
    num = quad.to_i(4)
    bin = num.to_s(2)
    bin.rjust(quad.length * 2, "0")
  end
end