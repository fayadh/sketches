
require "unimidi"
require "pry"

input = UniMIDI::Input.first

binding.pry

input.open do |input|

  puts "send some MIDI to your input now..."

  100.times do
    m = input.gets
    puts "Message: #{m}"
  end

end

binding.pry
puts "oh hai"
