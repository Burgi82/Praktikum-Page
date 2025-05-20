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
    isGuest(){
        return this.role === 'guest' || this.isEmployee() || this.isAdmin();
    }

    canEditOrders(){
        return this.isEmployee();
    }

    canViewAdminPanel(){
        return this.isAdmin();
    }
    canSetOrder(){
        return this.isGuest();
    }
}
module.exports = User;