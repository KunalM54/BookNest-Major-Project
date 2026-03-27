import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './student-layout.html',
  styleUrls: ['./student-layout.css', './student-layout-modal.css']
})
export class StudentLayoutComponent implements OnInit, OnDestroy {
  showLogoutModal = false;
  sidebarCollapsed = true;
  studentName: string = '';
  studentId: string = '';
  studentInitials: string = '';
  isDarkTheme = false;

  private readonly themeStorageKey = 'booknest_student_theme';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadStudentInfo();
    this.initializeTheme();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('student-dark-mode');
  }

  loadStudentInfo() {
    const user = this.authService.getUser();
    if (user) {
      this.studentName = user.fullName || 'Student';
      this.studentId = user.studentId || user.sid || '';
      this.studentInitials = this.getInitials(this.studentName);
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem(this.themeStorageKey, this.isDarkTheme ? 'dark' : 'light');
    this.applyThemePreference();
  }

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  confirmLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.showLogoutModal = false;
  }

  private initializeTheme() {
    const storedTheme = localStorage.getItem(this.themeStorageKey);
    if (storedTheme) {
      this.isDarkTheme = storedTheme === 'dark';
    } else {
      this.isDarkTheme = !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    }
    this.applyThemePreference();
  }

  private applyThemePreference() {
    document.body.classList.toggle('student-dark-mode', this.isDarkTheme);
  }
}
