// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React from 'react';
import { Button, Form, Input, Checkbox, Typography } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  EyeTwoTone,
  EyeInvisibleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const App: React.FC = () => {
  const [form] = Form.useForm();
  
  const onFinish = (values: { username: string; email: string; password: string; confirmPassword: string; agreement: boolean }) => {
    console.log('Form values:', values);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex w-full max-w-6xl h-[600px] shadow-2xl rounded-xl overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden md:flex md:w-2/5 bg-gradient-to-b from-blue-700 to-blue-900 text-white p-10 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center mb-12">
              <img
                src="https://readdy.ai/api/search-image?query=A%252520professional%252520sleek%252520modern%252520logo%252520for%252520Cooling%252520Maestro%252520featuring%252520a%252520stylized%252520snowflake%252520or%252520cooling%252520symbol%252520with%252520blue%252520gradient%252520colors.%252520The%252520logo%252520should%252520be%252520minimalist%252520corporate%252520and%252520suitable%252520for%252520an%252520industrial%252520cooling%252520calculation%252520software.%252520Clean%252520background%252520high%252520contrast.&width=60&height=60&seq=1&orientation=squarish"
                alt="Cooling Maestro Logo"
                className="h-12 w-12 object-contain mr-3"
              />
              <div>
                <h1 className="text-2xl font-bold">Cooling Maestro</h1>
                <p className="text-sm text-blue-100">Endüstriyel Soğutma Çözümleri</p>
              </div>
            </div>
            <Title level={2} className="text-3xl font-bold text-white mb-6">
              Cooling Maestro Ailesine Katılın
            </Title>
            <Paragraph className="text-blue-100 text-lg mb-8">
              Endüstriyel soğutma hesaplamalarınızı hızlı, doğru ve güvenilir bir şekilde yapmanızı sağlayan profesyonel platformumuza üye olun.
            </Paragraph>
            <div className="flex items-center space-x-2 text-blue-100">
              <i className="fas fa-check-circle text-blue-300"></i>
              <span>Sınırsız proje oluşturma ve saklama</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-100 mt-2">
              <i className="fas fa-check-circle text-blue-300"></i>
              <span>Detaylı hesaplama raporları ve analizler</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-100 mt-2">
              <i className="fas fa-check-circle text-blue-300"></i>
              <span>Teknik destek ve güncel standartlar</span>
            </div>
          </div>
          <img
            src="https://readdy.ai/api/search-image?query=A%252520professional%252520illustration%252520of%252520industrial%252520cooling%252520system%252520with%252520abstract%252520digital%252520elements%252520and%252520calculation%252520formulas%252520floating%252520around.%252520The%252520image%252520has%252520a%252520blue%252520gradient%252520background%252520that%252520perfectly%252520matches%252520the%252520registration%252520page%252520design.%252520The%252520illustration%252520is%252520modern%252520minimalist%252520and%252520suitable%252520for%252520a%252520professional%252520engineering%252520software%252520interface.&width=500&height=300&seq=3&orientation=landscape"
            alt="Industrial Cooling Illustration"
            className="absolute bottom-0 right-0 w-full opacity-20 object-cover object-top"
          />
        </div>
        
        {/* Right Side - Registration Form */}
        <div className="w-full md:w-3/5 bg-white p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="md:hidden flex items-center mb-8 justify-center">
              <img
                src="https://readdy.ai/api/search-image?query=A%252520professional%252520sleek%252520modern%252520logo%252520for%252520Cooling%252520Maestro%252520featuring%252520a%252520stylized%252520snowflake%252520or%252520cooling%252520symbol%252520with%252520blue%252520gradient%252520colors.%252520The%252520logo%252520should%252520be%252520minimalist%252520corporate%252520and%252520suitable%252520for%252520an%252520industrial%252520cooling%252520calculation%252520software.%252520Clean%252520background%252520high%252520contrast.&width=60&height=60&seq=1&orientation=squarish"
                alt="Cooling Maestro Logo"
                className="h-12 w-12 object-contain mr-3"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Cooling Maestro</h1>
                <p className="text-sm text-gray-500">Endüstriyel Soğutma Çözümleri</p>
              </div>
            </div>
            <Title level={3} className="text-2xl font-bold text-gray-800 mb-2">
              Kayıt Ol
            </Title>
            <Text className="text-gray-500 block mb-8">
              Hesap oluşturarak tüm özelliklere erişin
            </Text>
            <Form
              form={form}
              name="register"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
              className="w-full"
            >
              <Form.Item
                name="fullName"
                rules={[{ required: true, message: 'Lütfen ad soyadınızı girin!' }]}
              >
                <Input
                  size="large"
                  placeholder="Ad Soyad"
                  prefix={<UserOutlined className="text-gray-400" />}
                  className="rounded-lg py-2 px-4 border-gray-300"
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Lütfen e-posta adresinizi girin!' },
                  { type: 'email', message: 'Geçerli bir e-posta adresi girin!' }
                ]}
              >
                <Input
                  size="large"
                  placeholder="E-posta Adresi"
                  prefix={<MailOutlined className="text-gray-400" />}
                  className="rounded-lg py-2 px-4 border-gray-300"
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Lütfen şifrenizi girin!' },
                  { min: 8, message: 'Şifreniz en az 8 karakter olmalıdır!' }
                ]}
              >
                <Input.Password
                  size="large"
                  placeholder="Şifre"
                  prefix={<LockOutlined className="text-gray-400" />}
                  iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  className="rounded-lg py-2 px-4 border-gray-300"
                />
              </Form.Item>
              
              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Lütfen şifrenizi tekrar girin!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('İki şifre eşleşmiyor!'));
                    },
                  }),
                ]}
                className="mb-4"
              >
                <Input.Password
                  size="large"
                  placeholder="Şifre Tekrar"
                  prefix={<LockOutlined className="text-gray-400" />}
                  iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  className="rounded-lg py-2 px-4 border-gray-300"
                />
              </Form.Item>
              
              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value ? Promise.resolve() : Promise.reject(new Error('Kullanım koşullarını kabul etmelisiniz!')),
                  },
                ]}
                className="mb-6"
              >
                <Checkbox className="text-gray-600">
                  <span className="text-gray-600">
                    <a href="#" className="text-blue-600 hover:text-blue-800 !rounded-button whitespace-nowrap cursor-pointer">Kullanım koşullarını</a> ve <a href="#" className="text-blue-600 hover:text-blue-800 !rounded-button whitespace-nowrap cursor-pointer">Gizlilik politikasını</a> kabul ediyorum
                  </span>
                </Checkbox>
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  className="h-12 bg-blue-600 hover:bg-blue-700 !rounded-button whitespace-nowrap cursor-pointer"
                >
                  Kayıt Ol
                </Button>
              </Form.Item>
            </Form>
            
            <div className="text-center mt-8">
              <Text className="text-gray-600">
                Zaten hesabınız var mı? <Button type="link" className="p-0 text-blue-600 hover:text-blue-800 !rounded-button whitespace-nowrap cursor-pointer">Giriş Yapın</Button>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
