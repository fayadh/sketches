require "unimidi"
require "midi"

@i = UniMIDI::Input.use(:first)
@o = UniMIDI::Output.use(:first)


MIDI.using(@i, @o) do

  thru_except :note

  receive :note do |message|
    message.octave += 1 if %w{C E G}.include?(message.note_name)
    output message
    puts message
  end

  join

end
