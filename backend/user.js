class User{
    constructor({id, email, role}){
        this.id = id;
        this.email = email;
        this.role = role;
    }

    isAdmin(){
        return this.role === 'admin';
    }

    isEmployee(){
        return this.role ==='employee' || this.isAdmin();
    }

    canEditOrders(){
        return this.isEmployee();
    }

    canViewAdminPanel(){
        return this.isAdmin();
    }
}
module.exports = User;