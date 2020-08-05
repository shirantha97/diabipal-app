import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth, User } from 'firebase/app';
import {Router} from "@angular/router";
import {AlertController} from "@ionic/angular";
import {UsersService} from "../users.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  username: string = "";
  password: string = "";


  constructor(
    public auth: AngularFireAuth, 
    public alert: AlertController,
    public router: Router, 
    private user: UsersService

    ) { }

  ngOnInit() {
  }

  async login(){
    const { username, password } = this
    try {
      const res = await this.auth.signInWithEmailAndPassword(username, password)
      if(res.user){
        this.user.setUser({
          username,
          uid: res.user.uid
        })
        await this.router.navigate(['/tabs'])
      }
    } catch (e) {
      console.dir(e)
      await this.showAlert("Error!", e.message)
    }
  }

  registerRoute() {
    this.router.navigate(['/register'])
  }

  async showAlert(header: string, message: string){
    const alert = await this.alert.create({
      header,
      message,
      buttons: ['OK']
    })
    await alert.present()
  }
}
