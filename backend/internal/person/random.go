package person

import (
	"fmt"
	"math/rand/v2"
	"time"

	"github.com/google/uuid"
)

var firstNames = []string{
	"James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
	"William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
	"Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
	"Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
	"Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
	"Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa",
	"Edward", "Deborah", "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon",
	"Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", "Kathleen", "Gary", "Amy",
	"Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen", "Stephen", "Anna",
	"Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
	"Benjamin", "Samantha", "Samuel", "Katherine", "Gregory", "Christine", "Frank", "Debra",
	"Alexander", "Rachel", "Raymond", "Catherine", "Patrick", "Carolyn", "Jack", "Janet",
	"Dennis", "Ruth", "Jerry", "Maria", "Tyler", "Heather", "Aaron", "Diane",
}

var lastNames = []string{
	"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
	"Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
	"Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
	"Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
	"Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
	"Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
	"Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
	"Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
	"Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
	"Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
}

var countries = []string{
	"United States", "United Kingdom", "Germany", "Canada", "France",
	"Australia", "Japan", "India", "Netherlands", "Singapore",
	"Spain", "Brazil", "Sweden", "Switzerland", "Ireland",
}

var departmentRoles = map[string][]string{
	"Engineering": {
		"Software Engineer", "Senior Software Engineer", "Staff Engineer",
		"Engineering Manager", "DevOps Engineer", "QA Engineer", "Security Engineer",
	},
	"Product": {
		"Product Manager", "Senior Product Manager", "Technical Product Manager",
		"Product Owner", "Product Analyst",
	},
	"Design": {
		"Product Designer", "UI/UX Designer", "Design Lead", "UX Researcher",
	},
	"Sales": {
		"Account Executive", "Sales Development Rep", "Sales Manager",
		"Enterprise Account Executive", "Sales Director",
	},
	"Marketing": {
		"Marketing Manager", "Content Strategist", "Growth Marketer",
		"SEO Specialist", "Brand Designer",
	},
	"Finance": {
		"Financial Analyst", "Accountant", "Finance Manager", "Controller",
	},
	"Human Resources": {
		"HR Generalist", "Recruiter", "HR Business Partner", "People Operations Lead",
	},
	"Operations": {
		"Operations Coordinator", "Operations Manager", "Business Analyst",
	},
}

var departments = []string{
	"Engineering", "Product", "Design", "Sales",
	"Marketing", "Finance", "Human Resources", "Operations",
}

// generateRandomPerson produces a realistic synthetic Person record.
func generateRandomPerson() Person {
	dept := departments[rand.IntN(len(departments))]
	roles := departmentRoles[dept]
	role := roles[rand.IntN(len(roles))]

	firstName := firstNames[rand.IntN(len(firstNames))]
	lastName := lastNames[rand.IntN(len(lastNames))]
	name := fmt.Sprintf("%s %s", firstName, lastName)

	country := countries[rand.IntN(len(countries))]

	// Age between 21 and 65
	age := 21 + rand.IntN(45)

	// Base salary range: $45,000 to $180,000 with variance based on age/experience
	baseSalary := 45000.0 + float32(age-21)*2500.0
	// Add random variation (+/- $15,000)
	variation := float32(rand.IntN(30000) - 15000)
	salary := baseSalary + variation
	if salary < 35000 {
		salary = 35000
	}
	// Round to nearest 100
	salary = float32(int(salary/100) * 100)

	// JoinedAt within the last 5 years (~1825 days)
	daysAgo := rand.IntN(1825)
	joinedAt := time.Now().UTC().AddDate(0, 0, -daysAgo).Truncate(time.Second)

	// ~85% active, 15% inactive
	active := rand.IntN(100) < 85

	return Person{
		ID:         uuid.New(),
		Name:       name,
		Country:    country,
		Department: dept,
		Role:       role,
		Age:        age,
		Salary:     salary,
		JoinedAt:   joinedAt,
		Active:     active,
	}
}
