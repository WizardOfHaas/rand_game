#!/usr/bin/perl
#	game as described in https://www.rand.org/content/dam/rand/pubs/papers/2007/P1056.pdf
#	...and https://sci-hub.do/10.2307/167246
#	This will probably be reimplemented in PHP or Node.js, right now this is just for testing stuff out

use strict;
use warnings;

use Data::Dumper;

my $state = {
	total_sales => 0,
	unit_price => 0,
	unit_cost => 0,
	inventory => 0,
	max_productive_rate => 0,
	market_share => 0,

	#Allocation of budget for
	budget_marketing => 0, #Marketing
	budget_research => 0, #Research and development

	productive_capacity => 0, #"increase in productive capacity"
	
	total_funds => 0, #Funds available for next quarter

	#"Hidden values" used by the math model
	attractiveness => 0, #Proportional to marketing/r&r/price
};

my $margin_rates = {
	unit_price => 1,
	budget_marketing => 1,
	budget_research => 1,
	productive_capacity => 1
};

#Each turn players choose:
#	Product Price
#	Budget allocation
#	Rate of Production
#	Productive Capacity

#Marginal change: players can only change values by a set % each turn

#Math model
#	Size of Market: N
#		RANDOM?

#	Attractiveness:
#	a' = a[i] / sum(a) <-- Advertizing budget of team devided by sum of all budgets
#	r' = r[i] / sum(r) <-- Same normalized value, but for R&D budgets
#	p[i]		   <-- Just the price of the ith team's product
#	The actual math is some bullshit...
#	A[i] = c4 + e^(c1 * ' + c2 * r' - c3 * p[i])
#	...where constants are > 0, plus some unknown buffer constant c4 is added in...

#	Market Share:
#	f[i] = A[i] / sum(A)

#	Income:
#	R[i] = p[i] * f[i] * N
#	while f[i] * N <= q[i], where q is on-hand inventory

#	Unit Cost:
#	u[i] = c5 + (c6 + c7 * M) / (1 + c8 * m) + max(c9 / (1 + c10 * r), c11) + c12 / M
#	where c is fucking something
#	M is the max rate of production
#	m is current rate of production
#	r is current R&D budget
