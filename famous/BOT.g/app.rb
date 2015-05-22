require 'sinatra'
require 'sinatra/reloader' if development? 

get '/' do
	erb :index 
end

# get '/:open_world' do 
# 	erb :open_world
# end

post '/' do
	puts params
	if params[:command] == 'open world'
		erb :open_world
	else 
		erb :other
	end
end
