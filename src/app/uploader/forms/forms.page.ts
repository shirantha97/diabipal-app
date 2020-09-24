import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { Forms } from "../../../models/forms.model";
import { UsersService } from "../../users.service";
import { LoaderService } from "../../loader-service.service";
import { async } from "@angular/core/testing";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireAuth } from "@angular/fire/auth";
import { PredictionResults } from "../../../models/preditctionresults.model";
import { firestore } from "firebase/app";
import { ActivatedRoute } from '@angular/router'
import { Router } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular'
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { AlertController } from '@ionic/angular';


@Component({
  selector: "app-forms",
  templateUrl: "./forms.page.html",
  styleUrls: ["./forms.page.scss"],
})
export class FormsPage implements OnInit {

  form = {} as Forms;
  predictionResults = {} as PredictionResults;

  hidden: boolean = true
  cardioPredictionURL: string
  diabetesPredictionURL: string
  formCorrect: boolean = true

  constructor(
    private http: HttpClient,
    private users: UsersService,
    private aftStore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router,
    private toastCtrl: ToastController,
    private loadCtrl: LoadingController,
    private activateROute: ActivatedRoute,
    private loadingController: LoadingController,
    private loaderService: LoaderService,
    private alertController : AlertController,
    private user : UsersService
  ) { }

  userID: string;
  queryParams: any

  ngOnInit() {
    this.activateROute.queryParams.subscribe((res) => {
      this.queryParams = JSON.parse(res.value)
      this.form.glu = Number('this.queryParams.RESULT')
    });
  }


  selectTagSex(e) {
    if(e.detail.value == "1"){
      this.form.sex = 1
    }else {
      this.form.sex = 0
    }
  }

  selectTagexercise(e){
    this.form.exercise = e.detail.value
  }

  selectTagcigs(e){
    if(e.detail.value == "1"){
      this.form.cigs = 1
    }else {
      this.form.cigs = 0
    }
  }

  checkCholLevel(){
    if(this.form.age > 20){
      if(this.form.totChol < 125){
        this.formCorrect = false
        this.presentAlert("Check Cholesterol levels")
      }
    }
  }

  async presentAlert(msg) {
    const alert = await this.alertController.create({
      header: 'Error',
      subHeader: 'Inaccurate Details',
      message: msg,
      buttons: ['OK']
    });

    await alert.present();
  }

// selectTagpregnant(e) {
  //   this.form.preg = e.detail.value;
  // }

  // selectTagStrokes(e) {
  //   if(e.detail.value == "1"){
  //     this.form.stroke = 1
  //   }else {
  //     this.form.stroke = 0
  //   }
  // }

  // selectTagHypertesnion(e) {
  //   if(e.detail.value == "1"){
  //     this.form.hypertension = 1
  //   }else {
  //     this.form.hypertension = 0
  //   }
  // }

  // selectTagDiabetes(e) {
  //   if(e.detail.value == "1"){
  //     this.form.diabetes = 1
  //   }else {
  //     this.form.diabetes = 0
  //   }
  // }

  // selectTagBPmeds(e) {
  //   if(e.detail.value == "1"){
  //     this.form.bpmeds = 1
  //   }else {
  //     this.form.bpmeds = 0
  //   }
  // }
  // setheaders(): any {
  //   return {
  //     headers: new HttpHeaders()
  //       .append("Content-Type", "application/json")
  //       .append("Access-Control-Allow-Headers", "Content-Type")
  //       .append("Access-Control-Allow-Origin", "*"),
  //   };
  // 
  displayResults() {
    this.router.navigate(['/results'], {
      queryParams: {
        value: JSON.stringify(this.predictionResults)
      },
    });
  }

  async calculatePredictions() {

    this.checkCholLevel()

    if(this.formCorrect){
      this.loaderService.presentLoading("Please wait")

      try {
  
        this.cardioPredictionURL = "https://dry-lake-13859.herokuapp.com/predict";
        // this.cardioPredictionURL = " http://127.0.0.1:5000/predict";
  
  
        this.diabetesPredictionURL = "https://diabipal.herokuapp.com/predict";
  
        const diabetesData = {
          bmi:
            this.form.weight /
            ((this.form.height / 100) * (this.form.height / 100)),
          glu: this.form.glu,
          bp: this.form.bp,
          age: this.form.age,
          preg: this.form.preg,
          ins: this.form.ins,
          ped: this.form.ped,
          skin: this.form.skin,
        };
  
        await this.createprediction(diabetesData)
  
      } catch (e) { console.log(e) }
    }
  }


  async createprediction(diabetesData) {
    this.http
      .post(this.diabetesPredictionURL, diabetesData)
      .subscribe((data) => {

        this.loaderService.presentLoading('Please wait')

        this.predictionResults.diabetic_positive_prob = data["dm_prediction_prob_of_positive"] + "%";
        this.predictionResults.diabetic_negative_prob = data["dm_prediction_prob_of_negative"] + "%";
        this.predictionResults.diabetic_prediction = data["dm_prediction"]
        this.predictionResults.ob_stage = data["ob_stage"];
        this.predictionResults.ob_therapy = data["ob_therapy"];
        this.predictionResults.nutrition_info = data["nutrition_info"];
        this.predictionResults.physical_info = data["physical_info"];
        this.predictionResults.sleep_info = data["sleep_info"];
        this.predictionResults.behavioral_info = data["behavioral_info"];
        this.predictionResults.smoking_info = data["smoking_info"];

        let diabeticStatus: number;
        if (data["dm_prediction"] == "Negative") {
          diabeticStatus = 0;
        } else {
          diabeticStatus = 1;
        }
        var postData = {
          height: this.form.height,
          weight: this.form.weight,
          diaBp: this.form.bp,
          glu: this.form.glu,
          totChol: this.form.totChol,
          cigs: this.form.cigs,
          age: this.form.age,
          sex: this.form.sex,
          diabetes: diabeticStatus,
          exerciseRate: this.form.exercise
        };

        console.log(postData)
        console.log(diabetesData)

        this.http
          .post(this.cardioPredictionURL, postData)
          .subscribe((data) => {

            this.loaderService.presentLoading('Please wait')

            this.predictionResults.cardio_positive = data["positive_prediction"] + "%"
            this.predictionResults.cardio_negative = data["negative_prediction"] + "%"
            this.predictionResults.bmr = data["bmr"]
            this.predictionResults.tdee = data["tdee"]

            console.log(this.predictionResults)

            const cardiopositve = this.predictionResults.cardio_positive
            const cardionegative = this.predictionResults.cardio_negative
            const bmr = this.predictionResults.bmr
            const tdee = this.predictionResults.tdee
            const diabetespositive = this.predictionResults.diabetic_positive_prob
            const diabetesnegative = this.predictionResults.diabetic_negative_prob
            const diabetic_prediction = this.predictionResults.diabetic_prediction
            const ob_therapy = this.predictionResults.ob_therapy
            const ob_stage = this.predictionResults.ob_stage
            const nutrition_info = this.predictionResults.nutrition_info
            const physical_info = this.predictionResults.physical_info
            const sleep_info = this.predictionResults.sleep_info
            const behavioral_info = this.predictionResults.behavioral_info
            const smoking_info = this.predictionResults.smoking_info
            const height = this.form.height;
            const weight = this.form.weight;
            const glucose = this.form.glu;
            const blood_pressure = this.form.bp;
            const cigs = this.form.cigs;
            const diastolic_blood_pressure = this.form.bp;
            const current_date = new Date()
            const timeStamp = current_date.getTime()

            this.aftStore.doc(`users/${this.users.getUID()}`).update({
              data: firestore.FieldValue.arrayUnion({
                cardionegative,
                cardiopositve,
                bmr,
                tdee,
                diabetespositive,
                diabetesnegative,
                diabetic_prediction,
                ob_therapy,
                ob_stage,
                nutrition_info,
                physical_info,
                sleep_info,
                behavioral_info,
                smoking_info,
                height,
                weight,
                glucose,
                blood_pressure,
                cigs,
                diastolic_blood_pressure,
                current_date,
                timeStamp

              }),
            }).then(e => {
              this.loaderService.presentLoading('Generating Results')
              this.displayResults();
            });
          });
      });
  }


}
