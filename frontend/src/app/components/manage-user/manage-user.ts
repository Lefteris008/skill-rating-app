import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../shared/page-header/page-header';
import { UsersService } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-manage-user',
    standalone: true,
    imports: [CommonModule, FormsModule, PageHeaderComponent],
    templateUrl: './manage-user.html',
    styleUrl: './manage-user.css'
})
export class ManageUserComponent implements OnInit {
    private usersService = inject(UsersService);
    private authService = inject(AuthService);
    private router = inject(Router);

    userId: number | null = null;
    username: string = '';
    backLink: string = '/dashboard';
    backLabel: string = '← Dashboard';

    // Details
    realName: string = '';
    email: string = '';
    detailsSuccess = false;
    detailsError = '';

    private originalRealName: string = '';
    private originalEmail: string = '';

    // Password
    currentPassword = '';
    newPassword = '';
    repeatPassword = '';
    passwordSuccess = false;
    passwordError = '';

    ngOnInit() {
        const user = this.authService.getUser();
        console.log('[ManageUserComponent] Raw auth user:', user);

        if (user) {
            // The JWT strategy maps 'sub' to 'userId', so we should check both
            this.userId = user.id || user.userId || user.sub;
            console.log('[ManageUserComponent] Set userId to:', this.userId);

            this.username = user.username;

            // Determine back link based on role
            if (user.role === 'manager') {
                this.backLink = '/manager-rating';
                this.backLabel = '← Back to List';
            } else if (user.role === 'admin') {
                this.backLink = '/admin';
                this.backLabel = '← Admin Panel';
            } else {
                this.backLink = '/dashboard';
                this.backLabel = '← Dashboard';
            }

            // Pre-fill editable details
            this.realName = user.realName || '';
            this.email = user.email || '';

            // Track original values
            this.originalRealName = this.realName;
            this.originalEmail = this.email;
        } else {
            console.error('[ManageUserComponent] No user found in AuthService');
            this.router.navigate(['/login']);
        }
    }

    isDetailsValid(): boolean {
        // Must be non-empty AND at least one field must be different from original
        const hasChanges = this.realName !== this.originalRealName || this.email !== this.originalEmail;
        return !!(this.realName && this.email && hasChanges);
    }

    saveDetails() {
        if (!this.userId) return;
        this.detailsSuccess = false;
        this.detailsError = '';

        this.usersService.updateUserDetails(this.userId, {
            realName: this.realName,
            email: this.email
        }).subscribe({
            next: (res) => {
                this.detailsSuccess = true;
                // Update local storage user data if needed
                const currentUser = this.authService.getUser();
                if (currentUser) {
                    currentUser.realName = this.realName;
                    currentUser.email = this.email;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
                // Update original values to match new saved values
                this.originalRealName = this.realName;
                this.originalEmail = this.email;
            },
            error: (err) => {
                this.detailsError = err.error?.message || 'Failed to update details';
            }
        });
    }

    checkPasswordComplexity(password: string): boolean {
        const minLength = 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSymbol;
    }

    isPasswordValid(): boolean {
        return !!(
            this.currentPassword &&
            this.newPassword &&
            this.repeatPassword &&
            this.newPassword === this.repeatPassword &&
            this.checkPasswordComplexity(this.newPassword)
        );
    }

    changePassword() {
        if (!this.userId) return;
        this.passwordSuccess = false;
        this.passwordError = '';

        this.usersService.updateUserPassword(this.userId, {
            currentPass: this.currentPassword,
            newPass: this.newPassword
        }).subscribe({
            next: () => {
                this.passwordSuccess = true;
                this.currentPassword = '';
                this.newPassword = '';
                this.repeatPassword = '';
            },
            error: (err) => {
                this.passwordError = err.error?.message || 'Failed to change password';
            }
        });
    }
}
