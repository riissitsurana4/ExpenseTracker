'use client'
import { logout } from '../app/actions/logout.jsx';
export default function LogoutButton(){
    return(
        <form action={logout}>
            <button type="submit" className="logout-button">Logout</button>
        </form>
    )
}