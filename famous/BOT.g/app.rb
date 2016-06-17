require 'sinatra'
require 'sinatra/reloader' if development? 
require 'active_record'

ActiveRecord::Base.establish_connection(ENV['DATABASE_URL'] || 'postgres://localhost/mydb')

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
